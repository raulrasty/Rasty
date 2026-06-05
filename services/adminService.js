const supabase = require('../config/supabaseClient');

// ====================== ESTADÍSTICAS ======================

async function getStatsService() {
  const [
    { count: totalUsers },
    { count: totalListens },
    { count: totalAlbums },
    { data: topAlbums },
    { data: topUsers },
    { data: weeklyListens },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('listens').select('*', { count: 'exact', head: true }),
    supabase.from('albums').select('*', { count: 'exact', head: true }),
    supabase.from('listens')
      .select('album_id, albums(title, artist, cover_url)')
      .not('album_id', 'is', null)
      .limit(100),
    supabase.from('listens')
      .select('user_id, users(username, avatar_url)')
      .not('user_id', 'is', null)
      .limit(100),
    supabase.from('listens')
      .select('listen_date')
      .gte('listen_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Top 5 álbumes más escuchados
  const albumCount = {};
  const albumInfo = {};
  (topAlbums || []).forEach(l => {
    if (!l.album_id) return;
    albumCount[l.album_id] = (albumCount[l.album_id] || 0) + 1;
    if (l.albums) albumInfo[l.album_id] = l.albums;
  });
  const topAlbumsList = Object.entries(albumCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count, ...albumInfo[id] }));

  // Top 5 usuarios más activos
  const userCount = {};
  const userInfo = {};
  (topUsers || []).forEach(l => {
    if (!l.user_id) return;
    userCount[l.user_id] = (userCount[l.user_id] || 0) + 1;
    if (l.users) userInfo[l.user_id] = l.users;
  });
  const topUsersList = Object.entries(userCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count, ...userInfo[id] }));

  // Escuchas por día esta semana
  const byDay = {};
  (weeklyListens || []).forEach(l => {
    const day = new Date(l.listen_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return {
    totalUsers,
    totalListens,
    totalAlbums,
    topAlbums: topAlbumsList,
    topUsers: topUsersList,
    weeklyListens: byDay,
  };
}

// ====================== USUARIOS ======================

async function getAllUsersService(page = 1, limit = 10, search = '') {
  let query = supabase
    .from('users')
    .select('id, username, avatar_url, role, created_at, location', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) query = query.ilike('username', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { users: data, total: count, page, totalPages: Math.ceil(count / limit) };
}

async function changeUserRoleService(userId, role) {
  if (!['user', 'admin'].includes(role)) throw { status: 400, message: 'Rol inválido' };

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function adminDeleteUserService(userId) {
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (profileError) throw new Error(profileError.message);

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  return { message: 'Usuario eliminado' };
}

// ====================== ÁLBUMES ======================

async function getAllAlbumsAdminService(page = 1, limit = 10, search = '') {
  let query = supabase
    .from('albums')
    .select('id, title, artist, release_year, cover_url, musicbrainz_id', { count: 'exact' })
    .order('title', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { albums: data, total: count, page, totalPages: Math.ceil(count / limit) };
}

async function adminDeleteAlbumService(albumId) {
  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId);
  if (error) throw new Error(error.message);
  return { message: 'Álbum eliminado' };
}

// ====================== RESEÑAS ======================

async function getReviewsService(page = 1, limit = 10) {
  
  const { data, error, count } = await supabase
    .from('listens')
    .select('id, review, rating, listen_date, user_id, album_id', { count: 'exact' })
    .not('review', 'is', null)
    .like('review', '_%')
    .order('listen_date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  console.log('Reviews data:', JSON.stringify(data));
  console.log('Reviews error:', error);
  console.log('Reviews count:', count);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
  const albumIds = [...new Set((data || []).map(r => r.album_id).filter(Boolean))];

  const [usersRes, albumsRes] = await Promise.all([
    userIds.length ? supabase.from('users').select('id, username, avatar_url').in('id', userIds) : { data: [] },
    albumIds.length ? supabase.from('albums').select('id, title, artist').in('id', albumIds) : { data: [] },
  ]);

  const usersMap = Object.fromEntries((usersRes.data || []).map(u => [u.id, u]));
  const albumsMap = Object.fromEntries((albumsRes.data || []).map(a => [a.id, a]));

  const reviews = (data || []).map(r => ({
    ...r,
    users: usersMap[r.user_id] || null,
    albums: albumsMap[r.album_id] || null,
  }));

  return { reviews, total: count, page, totalPages: Math.ceil(count / limit) };
}

async function adminDeleteReviewService(listenId) {
  const { error } = await supabase
    .from('listens')
    .update({ review: null })
    .eq('id', listenId);
  if (error) throw new Error(error.message);
  return { message: 'Reseña eliminada' };
}

module.exports = {
  getStatsService,
  getAllUsersService,
  changeUserRoleService,
  adminDeleteUserService,
  getAllAlbumsAdminService,
  adminDeleteAlbumService,
  getReviewsService,
  adminDeleteReviewService,
};