const supabase = require('../config/supabaseClient');

// Seguir a un usuario
async function followUser(followerId, followingId) {
  if (followerId === followingId) throw new Error("No puedes seguirte a ti mismo");

  const { data, error } = await supabase
    .from('follows')
    .insert([{ follower_id: followerId, following_id: followingId }])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}

// Dejar de seguir a un usuario
async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw new Error(error.message);
  return { message: "Has dejado de seguir al usuario" };
}

// Comprobar si sigues a un usuario
async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (error) return false;
  return !!data;
}

// Obtener seguidores de un usuario
async function getFollowers(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, users!follows_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', userId);

  if (error) throw new Error(error.message);
  return data.map(f => f.users);
}

// Obtener usuarios que sigue un usuario
async function getFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, users!follows_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', userId);

  if (error) throw new Error(error.message);
  return data.map(f => f.users);
}

module.exports = { followUser, unfollowUser, isFollowing, getFollowers, getFollowing };