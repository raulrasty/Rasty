const supabase = require('../config/supabaseClient');

// Guardar o actualizar el rating de un usuario para un álbum
async function saveAlbumRating(albumId, userId, rating) {
  const { data, error } = await supabase
    .from('album_ratings')
    .upsert([{ album_id: albumId, user_id: userId, rating }], {
      onConflict: 'album_id,user_id'
    })
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// Obtener el rating de un usuario para un álbum
async function getAlbumRating(albumId, userId) {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('rating')
    .eq('album_id', albumId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data?.rating || null;
}

// Obtener la media de ratings de un álbum
async function getAlbumAverageRating(albumId) {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('rating')
    .eq('album_id', albumId);

  if (error) throw new Error(error.message);
  if (!data.length) return null;

  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return Math.round(avg * 10) / 10;
}

// Obtener distribución de ratings (para la gráfica)
async function getAlbumRatingDistribution(albumId) {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('rating')
    .eq('album_id', albumId);

  if (error) throw new Error(error.message);

  // Contar cuántos votos tiene cada puntuación
  const distribution = {};
  [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach(v => distribution[v] = 0);
  data.forEach(r => {
    if (distribution[r.rating] !== undefined) distribution[r.rating]++;
  });

  return { distribution, total: data.length };
}

// Obtener ratings de los usuarios que sigues para un álbum
async function getFollowingRatings(albumId, userId) {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows.length) return [];

  const followingIds = follows.map(f => f.following_id);

  const { data, error } = await supabase
    .from('album_ratings')
    .select('rating, user:user_id(id, username, avatar_url)')
    .eq('album_id', albumId)
    .in('user_id', followingIds);

  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  saveAlbumRating,
  getAlbumRating,
  getAlbumAverageRating,
  getAlbumRatingDistribution,
  getFollowingRatings
};