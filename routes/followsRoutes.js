const express = require('express');
const router = express.Router();
const followsController = require('../controllers/followsController');
const requireAuth = require('../middleware/requireAuth');

// Seguir a un usuario
router.post('/:userId', requireAuth, followsController.followUser);

// Dejar de seguir a un usuario
router.delete('/:userId', requireAuth, followsController.unfollowUser);

// Comprobar si sigues a un usuario
router.get('/is-following/:userId', requireAuth, followsController.isFollowing);

// Obtener seguidores de un usuario
router.get('/followers/:userId', followsController.getFollowers);

// Obtener usuarios que sigue un usuario
router.get('/following/:userId', followsController.getFollowing);

module.exports = router;