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

// Obtener todos los lanzamientos de un artista y separarlos por tipo
async function getReleasesDeezer(artistId) {
  let all = [];
  let url = `${DEEZER_BASE}/artist/${artistId}/albums?limit=50`;

  while (url) {
    const data = await fetchDeezer(url);
    if (data.data) all.push(...data.data);
    url = data.next || null;
  }

  // Deduplicar por título dentro de cada tipo
  const dedup = (releases) => {
    const seen = new Set();
    return releases.filter(r => {
      const key = r.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => {
      const ya = a.release_date ? parseInt(a.release_date) : 0;
      const yb = b.release_date ? parseInt(b.release_date) : 0;
      return ya - yb;
    });
  };

  return {
    albums: dedup(all.filter(r => r.record_type === 'album')),
    eps: dedup(all.filter(r => r.record_type === 'ep')),
  };
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

// Guardar y devolver un lote de releases de Deezer
async function saveReleases(releases, artistName) {
  const results = [];

  for (const deezerAlbum of releases) {
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
        .ilike("artist", artistName);
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
          artist: artistName,
          release_year: releaseYear,
          release_date: deezerAlbum.release_date || null,
          cover_url: deezerAlbum.cover_big || deezerAlbum.cover_medium || deezerAlbum.cover,
        }])
        .select();

      if (insertError) {
        console.error("Error insertando:", insertError.message);
        continue;
      }
      savedAlbum = newAlbum[0];
    }

    let tracks = await getTracksFromDB(savedAlbum.id);

    if (tracks.length === 0) {
      const tracksData = await fetchDeezer(`${DEEZER_BASE}/album/${deezerAlbum.id}/tracks`);
      const deezerTracks = tracksData.data || [];

      if (deezerTracks.length > 0) {
        const tracksToInsert = deezerTracks.map(t => ({
          album_id: savedAlbum.id,
          position: t.track_position,
          title: t.title,
          length: t.duration ? t.duration * 1000 : null,
          deezer_track_id: t.id,
          created_at: new Date().toISOString(),
        }));

        const { error: tracksError } = await supabase.from("songs").insert(tracksToInsert);
        if (!tracksError) tracks = tracksToInsert;
      }
    }

    results.push({ album: savedAlbum, tracks });
  }

  return results;
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

  // Obtener álbumes y EPs separados
  const { albums, eps } = await getReleasesDeezer(deezerArtistId);

  // Filtrar por título si se proporcionó
  const filterByTitle = (list) => title
    ? list.filter(a => a.title.toLowerCase().includes(title.toLowerCase()))
    : list;

  const filteredAlbums = filterByTitle(albums);
  const filteredEps = filterByTitle(eps);

  if (!filteredAlbums.length && !filteredEps.length) {
    throw new Error("No se encontraron lanzamientos");
  }

  // Paginación para álbumes
  const totalAlbums = filteredAlbums.length;
  const totalPagesAlbums = Math.ceil(totalAlbums / limit);
  const fromAlbums = (page - 1) * limit;
  const paginatedAlbums = filteredAlbums.slice(fromAlbums, fromAlbums + limit);

  // Paginación para EPs
  const totalEps = filteredEps.length;
  const totalPagesEps = Math.ceil(totalEps / limit);
  const fromEps = (page - 1) * limit;
  const paginatedEps = filteredEps.slice(fromEps, fromEps + limit);

  // Guardar y devolver
  const [albumResults, epResults] = await Promise.all([
    saveReleases(paginatedAlbums, deezerArtistName),
    saveReleases(paginatedEps, deezerArtistName),
  ]);

  return {
    albums: { results: albumResults, total: totalAlbums, page, totalPages: totalPagesAlbums },
    eps: { results: epResults, total: totalEps, page, totalPages: totalPagesEps },
  };
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums };