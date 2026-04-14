const supabase = require('../config/supabaseClient');

// Top 5 álbumes más escuchados esta semana
async function getTopAlbumsThisWeek() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('listens')
    .select('album_id, album:album_id(id, title, artist, cover_url)')
    .gte('listen_date', weekAgo.toISOString());

  if (error) throw new Error(error.message);

  const counts = {};
  data.forEach(l => {
    const id = l.album_id;
    if (!counts[id]) counts[id] = { album: l.album, count: 0 };
    counts[id].count++;
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Top 5 álbumes mejor valorados
async function getTopRatedAlbums() {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('album_id, rating, album:album_id(id, title, artist, cover_url)');

  if (error) throw new Error(error.message);

  const ratings = {};
  data.forEach(r => {
    const id = r.album_id;
    if (!ratings[id]) ratings[id] = { album: r.album, total: 0, count: 0 };
    ratings[id].total += r.rating;
    ratings[id].count++;
  });

  return Object.values(ratings)
    .map(r => ({ album: r.album, average: Math.round(r.total / r.count * 10) / 10, count: r.count }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);
}

// Última actividad de seguidos
async function getFollowingActivity(userId) {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows.length) return [];

  const followingIds = follows.map(f => f.following_id);

  const { data: listens, error: listensError } = await supabase
    .from('listens')
    .select('id, listen_date, rating, review, user_id, album:album_id(id, title, artist, cover_url)')
    .in('user_id', followingIds)
    .order('listen_date', { ascending: false })
    .order('id', { ascending: false });

  if (listensError) throw new Error(listensError.message);
  if (!listens.length) return [];

  // Quedarse solo con el listen más reciente de cada usuario
  const seen = new Set();
  const unique = [];
  for (const l of listens) {
    if (!seen.has(l.user_id)) {
      seen.add(l.user_id);
      unique.push(l);
    }
    if (unique.length >= 5) break;
  }

  // Obtener datos de los usuarios
  const userIds = unique.map(l => l.user_id);
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .in('id', userIds);

  if (usersError) throw new Error(usersError.message);

  // Obtener canciones favoritas de cada listen
  const listenIds = unique.map(l => l.id);
  const { data: favSongs, error: favSongsError } = await supabase
    .from('listen_favorite_songs')
    .select('listen_id, song:song_id(id, title)')
    .in('listen_id', listenIds);

  if (favSongsError) throw new Error(favSongsError.message);

  return unique.map(l => ({
    ...l,
    user: users.find(u => u.id === l.user_id) || null,
    favoriteSongs: favSongs.filter(f => f.listen_id === l.id).map(f => f.song)
  }));
}
// Top 5 más escuchados esta semana entre seguidos
async function getFollowingTopThisWeek(userId) {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows.length) return [];

  const followingIds = follows.map(f => f.following_id);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('listens')
    .select('album_id, album:album_id(id, title, artist, cover_url)')
    .in('user_id', followingIds)
    .gte('listen_date', weekAgo.toISOString());

  if (error) throw new Error(error.message);

  const counts = {};
  data.forEach(l => {
    const id = l.album_id;
    if (!counts[id]) counts[id] = { album: l.album, count: 0 };
    counts[id].count++;
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Top 5 mejor valorados entre seguidos
async function getFollowingTopRated(userId) {
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (followsError) throw new Error(followsError.message);
  if (!follows.length) return [];

  const followingIds = follows.map(f => f.following_id);

  const { data, error } = await supabase
    .from('album_ratings')
    .select('album_id, rating, album:album_id(id, title, artist, cover_url)')
    .in('user_id', followingIds);

  if (error) throw new Error(error.message);

  const ratings = {};
  data.forEach(r => {
    const id = r.album_id;
    if (!ratings[id]) ratings[id] = { album: r.album, total: 0, count: 0 };
    ratings[id].total += r.rating;
    ratings[id].count++;
  });

  return Object.values(ratings)
    .map(r => ({ album: r.album, average: Math.round(r.total / r.count * 10) / 10, count: r.count }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);
}


// Última actividad propia
async function getOwnActivity(userId) {
  const { data: listens, error: listensError } = await supabase
    .from('listens')
    .select('id, listen_date, rating, review, album:album_id(id, title, artist, cover_url)')
    .eq('user_id', userId)
    .order('listen_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(5);

  if (listensError) throw new Error(listensError.message);
  if (!listens.length) return [];

  // Obtener canciones favoritas de cada listen
  const listenIds = listens.map(l => l.id);
  const { data: favSongs, error: favSongsError } = await supabase
    .from('listen_favorite_songs')
    .select('listen_id, song:song_id(id, title)')
    .in('listen_id', listenIds);

  if (favSongsError) throw new Error(favSongsError.message);

  return listens.map(l => ({
    ...l,
    favoriteSongs: favSongs.filter(f => f.listen_id === l.id).map(f => f.song)
  }));
}

module.exports = {
  getTopAlbumsThisWeek,
  getTopRatedAlbums,
  getFollowingActivity,
  getFollowingTopThisWeek,
  getFollowingTopRated,
  getOwnActivity
};
