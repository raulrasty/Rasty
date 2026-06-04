require("dotenv").config();
const supabase = require("../config/supabaseClient");

const DEEZER_BASE = "https://api.deezer.com";

async function fetchDeezer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Deezer error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Deezer error: ${data.error.message}`);
  return data;
}

async function searchArtistDeezer(artistName) {
  const data = await fetchDeezer(`${DEEZER_BASE}/search/artist?q=${encodeURIComponent(artistName)}&limit=5`);
  return data.data || [];
}

async function getAlbumsDeezer(artistId) {
  let all = [];
  let url = `${DEEZER_BASE}/artist/${artistId}/albums?limit=50`;

  while (url) {
    const data = await fetchDeezer(url);
    if (data.data) all.push(...data.data);
    url = data.next || null;
  }

  const seen = new Set();
  return all.filter(album => {
    if (album.record_type !== 'album') return false;
    const key = album.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    const ya = a.release_date ? parseInt(a.release_date) : 0;
    const yb = b.release_date ? parseInt(b.release_date) : 0;
    return ya - yb;
  });
}

async function getTracksDeezer(albumId) {
  const data = await fetchDeezer(`${DEEZER_BASE}/album/${albumId}/tracks`);
  return data.data || [];
}

async function getAllAlbums() {
  const { data, error } = await supabase.from("albums").select("*");
  if (error) throw new Error(error.message);
  return data;
}

async function createAlbum(albumData) {
  const { data, error } = await supabase.from("albums").insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function getTracksFromDB(albumId) {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("album_id", albumId)
    .order("position", { ascending: true });
  if (error) return [];
  return data || [];
}

async function searchAndSaveAlbums(title, artist, artistId = null, page = 1, limit = 6) {
  if (!artist && !artistId) throw new Error("Debes proporcionar un artista");

  let deezerArtistId = artistId;
  let deezerArtistName = artist;

  if (!deezerArtistId) {
    const artists = await searchArtistDeezer(artist);
    if (!artists.length) throw new Error("No se encontró el artista");

    if (artists.length > 1) {
      return {
        disambiguation: true,
        candidates: artists.map(a => ({
          id: a.id,
          name: a.name,
          picture: a.picture_medium,
          nb_album: a.nb_album,
          nb_fan: a.nb_fan,
        })),
      };
    }

    deezerArtistId = artists[0].id;
    deezerArtistName = artists[0].name;
  }

  let albums = await getAlbumsDeezer(deezerArtistId);

  if (title) {
    albums = albums.filter(a =>
      a.title.toLowerCase().includes(title.toLowerCase())
    );
  }

  if (!albums.length) throw new Error("No se encontraron álbumes");

  const total = albums.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const paginated = albums.slice(from, from + limit);

  const results = [];

  for (const deezerAlbum of paginated) {
    const deezerId = String(deezerAlbum.id);
    const releaseYear = deezerAlbum.release_date
      ? parseInt(deezerAlbum.release_date.split('-')[0])
      : null;

    let { data: existing } = await supabase
      .from("albums")
      .select("*")
      .eq("musicbrainz_id", `deezer_${deezerId}`);

    if (!existing || existing.length === 0) {
      const { data: byTitle } = await supabase
        .from("albums")
        .select("*")
        .ilike("title", deezerAlbum.title)
        .ilike("artist", deezerArtistName);
      existing = byTitle;
    }

    let savedAlbum;

    if (existing && existing.length > 0) {
      savedAlbum = existing[0];
    } else {
      const { data: newAlbum, error: insertError } = await supabase
        .from("albums")
        .insert([{
          musicbrainz_id: `deezer_${deezerId}`,
          title: deezerAlbum.title,
          artist: deezerArtistName,
          release_year: releaseYear,
          release_date: deezerAlbum.release_date || null,
          cover_url: deezerAlbum.cover_big || deezerAlbum.cover_medium || deezerAlbum.cover,
        }])
        .select();

      if (insertError) {
        console.error("Error insertando álbum:", insertError.message);
        continue;
      }
      savedAlbum = newAlbum[0];
    }

    let tracks = await getTracksFromDB(savedAlbum.id);

    if (tracks.length === 0) {
      const deezerTracks = await getTracksDeezer(deezerAlbum.id);
      if (deezerTracks.length > 0) {
        const tracksToInsert = deezerTracks.map(t => ({
          album_id: savedAlbum.id,
          position: t.track_position,
          title: t.title,
          length: t.duration ? t.duration * 1000 : null,
          deezer_track_id: t.id, // guardar ID de Deezer para obtener preview después
          created_at: new Date().toISOString(),
        }));

        const { error: tracksError } = await supabase.from("songs").insert(tracksToInsert);
        if (!tracksError) tracks = tracksToInsert;
      }
    }

    results.push({ album: savedAlbum, tracks });
  }

  return { results, total, page, totalPages };
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums };