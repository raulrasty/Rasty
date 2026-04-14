const express = require('express');
const router = express.Router();
const favoriteAlbumsController = require('../controllers/favoriteAlbumsController');
const requireAuth = require('../middleware/requireAuth');

// Obtener álbumes favoritos de un usuario
router.get('/:userId', favoriteAlbumsController.getFavoriteAlbums);

// Guardar álbumes favoritos del usuario logueado
router.post('/', requireAuth, favoriteAlbumsController.saveFavoriteAlbums);

module.exports = router;