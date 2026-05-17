require("dotenv").config();
const supabase = require("../config/supabaseClient");
//obtener todos los albumes
async function getAllAlbums() {
  const { data, error } = await supabase.from("albums").select("*");
  if (error) throw new Error(error.message);
  return data;
}
//crear album
async function createAlbum(albumData) {
  const { data, error } = await supabase.from("albums").insert([albumData]).select();
  if (error) throw new Error(error.message);
  return data[0];
}
//obtener las canciones 
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

// Recibir álbumes desde el frontend, guardarlos y devolverlos

async function saveFromFrontend(albumsData) {
  const results = [];

  for (const item of albumsData) {
    const { rgId, title, artist, releaseYear, releaseDate, coverUrl, tracks: incomingTracks } = item;

    // Buscar por musicbrainz_id
    let { data: existing } = await supabase
      .from("albums")
      .select("*")
      .eq("musicbrainz_id", rgId);

    // Si no existe, buscar por título + artista
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
      const { data: newAlbum, error: insertError } = await supabase
        .from("albums")
        .insert([{
          musicbrainz_id: rgId,
          title,
          artist,
          release_year: releaseYear,
          release_date: releaseDate,
          cover_url: coverUrl,
        }])
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

  return results;
}

async function searchAndSaveAlbums(title, artist, artistId = null, page = 1, limit = 6) {
  // Solo buscar en DB — si no hay nada devolver needsMusicBrainz
  if (artist) {
    let query = supabase.from("albums").select("*").ilike("artist", `%${artist}%`);
    if (title) query = query.ilike("title", `%${title}%`);
    const { data, error } = await query.order("release_year", { ascending: true });
    if (error) throw new Error(error.message);

    if (data && data.length > 0) {
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
  }

  return { needsMusicBrainz: true };
}

module.exports = { getAllAlbums, createAlbum, searchAndSaveAlbums, saveFromFrontend };