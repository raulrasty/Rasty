const supabase = require('../config/supabaseClient');
const albumsService = require('./albumsService'); // para crear álbum si no existe

async function createListen(userId, { albumTitle, albumArtist, rating = null, liked = false, review = null, listen_date = null }) {
  // 1️⃣ Asegurarse de que el álbum exista
  let album;
  try {
    const result = await albumsService.searchAndSaveAlbum(albumTitle, albumArtist);
    album = result.album; // tomamos solo el objeto album
  } catch (err) {
    throw new Error("No se pudo obtener o crear el álbum: " + err.message);
  }

  // 2️⃣ Si no se pasó listen_date, usar la fecha de hoy
  const dateToUse = listen_date ? new Date(listen_date) : new Date();

  // 3️⃣ Validar que no sea futura
  const now = new Date();
  if (dateToUse > now) {
    throw new Error("La fecha de escucha no puede ser futura");
  }

  // 4️⃣ Crear registro en listens
  const { data, error } = await supabase
    .from('listens')
    .insert([{
      user_id: userId,
      album_id: album.id,
      rating,
      liked,
      review,
      listen_date: dateToUse.toISOString()
    }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

async function getListensByUser(user_id) {
  const { data, error } = await supabase
    .from('listens')
    .select(`*, album:album_id(*)`) // incluir info del álbum
    .eq('user_id', user_id)
    .order('listen_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { createListen, getListensByUser };