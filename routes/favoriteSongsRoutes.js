const express = require('express');
const router = express.Router();
const favoriteSongsController = require('../controllers/favoriteSongsController');
const requireAuth = require('../middleware/requireAuth');

// Listen favorite songs
router.post('/listen/:listenId', requireAuth, favoriteSongsController.saveListenFavoriteSongs);
router.get('/listen/:listenId', favoriteSongsController.getListenFavoriteSongs);

// top comunidad
router.get('/album/:albumId/top', favoriteSongsController.getTopAlbumSongsByUsers);
//Top de la gente que sigues
router.get('/album/:albumId/following', requireAuth, favoriteSongsController.getFollowingFavoritesByAlbum);

// Album favorite songs
router.post('/album/:albumId', requireAuth, favoriteSongsController.saveAlbumFavoriteSongs);
router.get('/album/:albumId', requireAuth, favoriteSongsController.getAlbumFavoriteSongs);

module.exports = router;