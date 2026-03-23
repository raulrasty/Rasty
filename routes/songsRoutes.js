// routes/songsRoutes.js
const express = require('express');
const router = express.Router();
const songsController = require('../controllers/songsController');

// GET /songs/:album_id → listado de canciones de un álbum
router.get('/:album_id', songsController.getAlbumSongs);

module.exports = router;