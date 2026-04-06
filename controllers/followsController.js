const followsService = require('../services/followsService');

// Seguir a un usuario
async function followUser(req, res) {
  const followerId = req.user.id;
  const { userId } = req.params;

  try {
    const result = await followsService.followUser(followerId, userId);
    res.json({ message: "Ahora sigues a este usuario", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Dejar de seguir a un usuario
async function unfollowUser(req, res) {
  const followerId = req.user.id;
  const { userId } = req.params;

  try {
    const result = await followsService.unfollowUser(followerId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Comprobar si sigues a un usuario
async function isFollowing(req, res) {
  const followerId = req.user.id;
  const { userId } = req.params;

  try {
    const following = await followsService.isFollowing(followerId, userId);
    res.json({ following });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener seguidores de un usuario
async function getFollowers(req, res) {
  const { userId } = req.params;

  try {
    const followers = await followsService.getFollowers(userId);
    res.json(followers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener usuarios que sigue un usuario
async function getFollowing(req, res) {
  const { userId } = req.params;

  try {
    const following = await followsService.getFollowing(userId);
    res.json(following);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { followUser, unfollowUser, isFollowing, getFollowers, getFollowing };