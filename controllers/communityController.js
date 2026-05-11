const communityService = require('../services/communityService');

// Obtener álbumes más escuchados de la semana
async function getTopAlbumsThisWeek(req, res) {
  try {
    const data = await communityService.getTopAlbumsThisWeek();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Obtener álbumes mejor valorados 
async function getTopRatedAlbums(req, res) {
  try {
    const data = await communityService.getTopRatedAlbums();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Obtener actividad de usuarios seguidos
async function getFollowingActivity(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingActivity(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Obtener álbumes más escuchados de la semana por usuarios seguidos
async function getFollowingTopThisWeek(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingTopThisWeek(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Obtener álbumes mejor valorados por usuarios seguidos
async function getFollowingTopRated(req, res) {
  const userId = req.user.id;
  try {
    const data = await communityService.getFollowingTopRated(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Obtener actividad propia del usuario autenticado
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