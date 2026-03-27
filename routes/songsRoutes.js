// routes/songsRoutes.js
const express = require('express');
const router = express.Router();
const songsController = require('../controllers/songsController');

//ruta para obtener las canciones de un album
router.get('/:album_id', songsController.getAlbumSongs);

module.exports = router;