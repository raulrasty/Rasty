require('dotenv').config();
const supabase = require('../config/supabaseClient');
const userAgentMB = process.env.MUSICBRAINZ_USER_AGENT;

async function getAllAlbums() {
  const { data, error } = await supabase.from('albums').select('*');
  if (error) throw new Error(error.message);
  return data;
}

async function createAlbum(albumData) {
  const { data, error } = await supabase.from('albums').insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function searchAndSaveAlbum(title, artist) {
  // 1️⃣ Construir la query para MusicBrainz
  let mbQuery = `release:${encodeURIComponent(title)}`;
  if (artist) mbQuery += ` AND artist:${encodeURIComponent(artist)}`;

  const response = await fetch(
    `https://musicbrainz.org/ws/2/release/?query=${mbQuery}&fmt=json`,
    { headers: { "User-Agent": userAgentMB } }
  );
  const data = await response.json();

  if (!data.releases || data.releases.length === 0) {
    throw new Error("Álbum no encontrado en MusicBrainz");
  }

  const albumMB = data.releases[0];
  const albumId = albumMB.id;

  // 2️⃣ Verificar si ya existe en la tabla
  const { data: existing, error: existingError } = await supabase
    .from("albums")
    .select("*")
    .eq("musicbrainz_id", albumId);

  if (existingError) throw new Error(existingError.message);

  let releaseDate = null;
  let releaseYear = null;

  if (albumMB.date) {
    const parts = albumMB.date.split("-");
    if (parts.length === 3) releaseDate = albumMB.date;
    if (parts.length >= 1) releaseYear = parseInt(parts[0]);
  }

  const albumData = {
    musicbrainz_id: albumId,
    title: albumMB.title,
    artist: albumMB['artist-credit'][0].name,
    release_date: releaseDate,
    release_year: releaseYear,
    cover_url: `https://coverartarchive.org/release/${albumId}/front`
  };

  let savedAlbum;
  if (existing.length > 0) {
    savedAlbum = existing[0];
  } else {
    const { data: newAlbum, error: insertError } = await supabase
      .from('albums')
      .insert([albumData])
      .select();
    if (insertError) throw new Error(insertError.message);
    savedAlbum = newAlbum[0];
  }

  // 3️⃣ Traer lista de canciones del álbum desde MusicBrainz
  const tracksResponse = await fetch(
    `https://musicbrainz.org/ws/2/release/${albumId}?inc=recordings&fmt=json`,
    { headers: { "User-Agent": userAgentMB } }
  );
  const tracksData = await tracksResponse.json();

  let tracks = [];
  if (tracksData.media && tracksData.media.length > 0) {
    tracks = tracksData.media.flatMap(medium =>
      medium.tracks.map(track => ({
        position: track.position,
        title: track.title,
        length: track.length
      }))
    );
  }

  // 4️⃣ Guardar canciones en tabla songs
  if (tracks.length > 0) {
    const tracksToInsert = tracks.map(track => ({
      album_id: savedAlbum.id,
      position: track.position,
      title: track.title,
      length: track.length,
      created_at: new Date().toISOString()
    }));

    const { error: tracksError } = await supabase
      .from('songs')
      .insert(tracksToInsert);

    if (tracksError) console.error("Error guardando canciones:", tracksError);
  }

  return { message: existing.length > 0 ? "Álbum ya existe" : "Álbum guardado", album: savedAlbum, tracks };
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbum };
