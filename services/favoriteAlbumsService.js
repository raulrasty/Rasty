const supabase = require('../config/supabaseClient');

// Obtener los 5 álbumes favoritos de un usuario
async function getFavoriteAlbums(userId) {
  const { data, error } = await supabase
    .from('favorite_albums')
    .select('position, album:album_id(id, title, artist, cover_url)')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Guardar álbumes favoritos (reemplaza todos los anteriores)
async function saveFavoriteAlbums(userId, albums) {
  // albums es un array de { album_id, position }
  if (albums.length > 5) throw new Error("Solo puedes tener 5 álbumes favoritos");

  // Borrar los anteriores
  await supabase
    .from('favorite_albums')
    .delete()
    .eq('user_id', userId);

  if (albums.length === 0) return [];

  const inserts = albums.map(a => ({
    user_id: userId,
    album_id: a.album_id,
    position: a.position
  }));

  const { data, error } = await supabase
    .from('favorite_albums')
    .insert(inserts)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { getFavoriteAlbums, saveFavoriteAlbums };