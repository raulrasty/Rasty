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

// Obtener las 3 canciones más elegidas como favoritas de un álbum por todos los usuarios
async function getTopAlbumSongsByUsers(albumId) {
  const { data, error } = await supabase
    .from('album_favorite_songs')
    .select('song_id, song:song_id(id, title, position)')
    .eq('album_id', albumId);

  if (error) throw new Error(error.message);

  // Contar cuántas veces aparece cada canción
  const counts = {};
  data.forEach(f => {
    const id = f.song_id;
    if (!counts[id]) counts[id] = { song: f.song, count: 0 };
    counts[id].count++;
  });

  // Ordenar por count y devolver las 3 primeras
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

// Obtener favoritas del álbum de los usuarios que sigues
async function getFollowingFavoritesByAlbum(albumId, userId) {
  // Obtener IDs de usuarios que sigues
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows.length) return [];

  const followingIds = follows.map(f => f.following_id);

  // Obtener sus favoritas de este álbum
  const { data, error } = await supabase
    .from('album_favorite_songs')
    .select('user_id, song_id, song:song_id(id, title), user:user_id(id, username, avatar_url)')
    .eq('album_id', albumId)
    .in('user_id', followingIds);

  if (error) throw new Error(error.message);

  // Agrupar por usuario
  const grouped = {};
  data.forEach(f => {
    const uid = f.user_id;
    if (!grouped[uid]) grouped[uid] = { user: f.user, songs: [] };
    grouped[uid].songs.push(f.song);
  });

  return Object.values(grouped);
}


module.exports = {
  saveListenFavoriteSongs,
  getListenFavoriteSongs,
  saveAlbumFavoriteSongs,
  getAlbumFavoriteSongs,
  getTopAlbumSongsByUsers,
  getFollowingFavoritesByAlbum 
};