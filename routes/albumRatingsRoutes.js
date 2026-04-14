const express = require('express');
const router = express.Router();
const albumRatingsController = require('../controllers/albumRatingsController');
const requireAuth = require('../middleware/requireAuth');

// Guardar rating del usuario
router.post('/:albumId', requireAuth, albumRatingsController.saveAlbumRating);

// Obtener rating del usuario
router.get('/:albumId/my-rating', requireAuth, albumRatingsController.getAlbumRating);

// Obtener media de ratings
router.get('/:albumId/average', albumRatingsController.getAlbumAverageRating);

// Obtener distribución de ratings para la gráfica
router.get('/:albumId/distribution', albumRatingsController.getAlbumRatingDistribution);

// Obtener ratings de usuarios seguidos
router.get('/:albumId/following', requireAuth, albumRatingsController.getFollowingRatings);

module.exports = router;