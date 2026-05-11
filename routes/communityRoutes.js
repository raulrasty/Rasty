const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const requireAuth = require('../middleware/requireAuth');

// Obtener álbumes más escuchados de la semana
router.get('/top-week', communityController.getTopAlbumsThisWeek);
// Obtener álbumes mejor valorados
router.get('/top-rated', communityController.getTopRatedAlbums);
// Obtener actividad de usuarios seguidos
router.get('/following-activity', requireAuth, communityController.getFollowingActivity);
// Obtener álbumes más escuchados por usuarios seguidos esta semana
router.get('/following-top-week', requireAuth, communityController.getFollowingTopThisWeek);
// Obtener álbumes mejor valorados por usuarios seguidos
router.get('/following-top-rated', requireAuth, communityController.getFollowingTopRated);
// Obtener actividad del usuario autenticado
router.get('/own-activity', requireAuth, communityController.getOwnActivity);

module.exports = router;