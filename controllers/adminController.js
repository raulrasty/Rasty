const {
  getStatsService,
  getAllUsersService,
  changeUserRoleService,
  adminDeleteUserService,
  getAllAlbumsAdminService,
  adminDeleteAlbumService,
  getReviewsService,
  adminDeleteReviewService,
} = require('../services/adminService');

async function getStats(req, res) {
  try {
    const stats = await getStatsService();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const data = await getAllUsersService(parseInt(page), parseInt(limit), search);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function changeUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const data = await changeUserRoleService(id, role);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const data = await adminDeleteUserService(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllAlbums(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const data = await getAllAlbumsAdminService(parseInt(page), parseInt(limit), search);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteAlbum(req, res) {
  try {
    const { id } = req.params;
    const data = await adminDeleteAlbumService(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReviews(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await getReviewsService(parseInt(page), parseInt(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const data = await adminDeleteReviewService(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStats,
  getAllUsers,
  changeUserRole,
  deleteUser,
  getAllAlbums,
  deleteAlbum,
  getReviews,
  deleteReview,
};
