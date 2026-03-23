// services/songsService.js
const supabase = require('../config/supabaseClient');

async function getSongsByAlbum(albumId) {
  try {
    const { data, error } = await supabase
      .from('songs')          // nombre de la tabla
      .select('position, title, length')  // columnas que quieres
      .eq('album_id', albumId) // filtro por album
      .order('position', { ascending: true }); // ordenar por posición

    if (error) {
      throw error;
    }

    return data; // devuelve un array de canciones
  } catch (err) {
    console.error('Error en SongsService:', err);
    throw err;
  }
}

module.exports = {
  getSongsByAlbum,
};