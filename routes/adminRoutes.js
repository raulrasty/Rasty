const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  getStats,
  getAllUsers,
  changeUserRole,
  deleteUser,
  getAllAlbums,
  deleteAlbum,
  getReviews,
  deleteReview,
} = require('../controllers/adminController');

// Todas las rutas protegidas con requireAdmin
router.use(requireAdmin);

// Estadísticas
router.get('/stats', getStats);

// Usuarios
router.get('/users', getAllUsers);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

// Álbumes
router.get('/albums', getAllAlbums);
router.delete('/albums/:id', deleteAlbum);

// Reseñas
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
