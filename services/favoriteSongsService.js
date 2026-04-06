const supabase = require('../config/supabaseClient');


// LISTEN FAVORITE SONGS


// Guardar canciones favoritas de un listen (máximo 3)
async function saveListenFavoriteSongs(listenId, userId, songIds) {
  if (songIds.length > 3) throw new Error("Solo puedes elegir un máximo de 3 canciones favoritas");

  await supabase
    .from('listen_favorite_songs')
    .delete()
    .eq('listen_id', listenId)
    .eq('user_id', userId);

  if (songIds.length === 0) return [];

  const inserts = songIds.map(songId => ({
    listen_id: listenId,
    song_id: songId,
    user_id: userId
  }));

  const { data, error } = await supabase
    .from('listen_favorite_songs')
    .insert(inserts)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

// Obtener canciones favoritas de un listen
async function getListenFavoriteSongs(listenId) {
  const { data, error } = await supabase
    .from('listen_favorite_songs')
    .select('*, song:song_id(*)')
    .eq('listen_id', listenId);

  if (error) throw new Error(error.message);
  return data;
}


// ALBUM FAVORITE SONGS


// Guardar canciones favoritas de un álbum (máximo 3)
async function saveAlbumFavoriteSongs(albumId, userId, songIds) {
  if (songIds.length > 3) throw new Error("Solo puedes elegir un máximo de 3 canciones favoritas");

  await supabase
    .from('album_favorite_songs')
    .delete()
    .eq('album_id', albumId)
    .eq('user_id', userId);

  if (songIds.length === 0) return [];

  const inserts = songIds.map(songId => ({
    album_id: albumId,
    song_id: songId,
    user_id: userId
  }));

  const { data, error } = await supabase
    .from('album_favorite_songs')
    .insert(inserts)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

// Obtener canciones favoritas de un álbum para un usuario concreto
async function getAlbumFavoriteSongs(albumId, userId) {
  const { data, error } = await supabase
    .from('album_favorite_songs')
    .select('*, song:song_id(*)')
    .eq('album_id', albumId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  saveListenFavoriteSongs,
  getListenFavoriteSongs,
  saveAlbumFavoriteSongs,
  getAlbumFavoriteSongs
};