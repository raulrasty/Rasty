const communityService = require('../services/communityService');

async function getTopAlbumsThisWeek(req, res) {
  try {
    const data = await communityService.getTopAlbumsThisWeek();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTopRatedAlbums(req, res) {
  try {
    const data = await communityService.getTopRatedAlbums();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFollowingActivity(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingActivity(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFollowingTopThisWeek(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingTopThisWeek(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getFollowingTopRated(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingTopRated(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOwnActivity(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getOwnActivity(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getTopAlbumsThisWeek,
  getTopRatedAlbums,
  getFollowingActivity,
  getFollowingTopThisWeek,
  getFollowingTopRated,
  getOwnActivity
};