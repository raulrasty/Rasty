const express = require('express');
const router = express.Router();
const favoriteSongsController = require('../controllers/favoriteSongsController');
const requireAuth = require('../middleware/requireAuth');

// Listen favorite songs
router.post('/listen/:listenId', requireAuth, favoriteSongsController.saveListenFavoriteSongs);
router.get('/listen/:listenId', favoriteSongsController.getListenFavoriteSongs);

// Album favorite songs
router.post('/album/:albumId', requireAuth, favoriteSongsController.saveAlbumFavoriteSongs);
router.get('/album/:albumId', requireAuth, favoriteSongsController.getAlbumFavoriteSongs);

module.exports = router;