require("dotenv").config();
const supabase = require("../config/supabaseClient");

// Obtener todos los álbumes guardados
async function getAllAlbums() {
  const { data, error } = await supabase.from("albums").select("*");
  if (error) throw new Error(error.message);
  return data;
}

// Crear un nuevo álbum en la base de datos
async function createAlbum(albumData) {
  const { data, error } = await supabase.from("albums").insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

// Obtener canciones de un álbum desde la base de datos
async function getTracksFromDB(albumId) {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("album_id", albumId)
    .order("position", { ascending: true });
  if (error) {
    console.error("Error obteniendo canciones de la DB:", error);
    return [];
  }
  return data || [];
}

// Buscar álbumes en Supabase por artista
async function searchInDB(artist, title, page = 1, limit = 6) {
  let query = supabase
    .from("albums")
    .select("*")
    .ilike("artist", `%${artist}%`);

  if (title) query = query.ilike("title", `%${title}%`);

  const { data, error } = await query.order("release_year", { ascending: true });
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const paginated = data.slice(from, from + limit);

  const results = await Promise.all(
    paginated.map(async (album) => {
      const tracks = await getTracksFromDB(album.id);
      return { album, tracks };
    })
  );

  return { results, total, page, totalPages };
}

// Recibir álbumes desde el frontend y guardarlos en Supabase
async function saveFromFrontend(albumsData, page = 1, limit = 6) {
  const results = [];

  for (const item of albumsData) {
    const { rgId, title, artist, releaseYear, releaseDate, coverUrl, tracks: incomingTracks } = item;

    // Comprobar si ya existe por musicbrainz_id
    let { data: existing } = await supabase
      .from("albums")
      .select("*")
      .eq("musicbrainz_id", rgId);

    // Si no, buscar por título + artista
    if (!existing || existing.length === 0) {
      const { data: byTitle } = await supabase
        .from("albums")
        .select("*")
        .ilike("title", title)
        .ilike("artist", artist);
      existing = byTitle;
    }

    let savedAlbum;

    if (existing && existing.length > 0) {
      savedAlbum = existing[0];
    } else {
      // Guardar álbum nuevo
      const { data: newAlbum, error: insertError } = await supabase
        .from("albums")
        .insert([{ musicbrainz_id: rgId, title, artist, release_year: releaseYear, release_date: releaseDate, cover_url: coverUrl }])
        .select();
      if (insertError) {
        console.error("Error insertando álbum:", insertError.message);
        continue;
      }
      savedAlbum = newAlbum[0];
    }

    // Obtener canciones existentes
    let tracks = await getTracksFromDB(savedAlbum.id);

    // Si no hay canciones y el frontend mandó tracks, guardarlas
    if (tracks.length === 0 && incomingTracks?.length > 0) {
      const tracksToInsert = incomingTracks.map(t => ({
        album_id: savedAlbum.id,
        position: t.position,
        title: t.title,
        length: t.length,
        created_at: new Date().toISOString(),
      }));
      const { error: tracksError } = await supabase.from("songs").insert(tracksToInsert);
      if (!tracksError) tracks = tracksToInsert;
    }

    results.push({ album: savedAlbum, tracks });
  }

  // Paginación sobre los resultados
  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const paginated = results.slice(from, from + limit);

  return { results: paginated, total, page, totalPages };
}

// Buscar en DB primero, si no hay resultados devolver null para que el frontend busque en MB
async function searchAndSaveAlbums(title, artist, artistId = null, page = 1, limit = 6) {
  if (artist) {
    const dbResults = await searchInDB(artist, title, page, limit);
    if (dbResults) {
      console.log(`Artista "${artist}" encontrado en DB con ${dbResults.total} álbumes`);
      return dbResults;
    }
    console.log(`Artista "${artist}" no está en DB`);
  }
  // Si no hay nada en DB devolver indicación para que el frontend busque en MusicBrainz
  return { needsMusicBrainz: true };
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums, saveFromFrontend };