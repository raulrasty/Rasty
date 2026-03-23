const express = require('express');
const router = express.Router();

const albumsController = require('../controllers/albumsController');

// Obtener todos los álbumes
router.get('/', albumsController.getAlbums);


// Buscar y guardar álbum desde MusicBrainz
router.get('/search-mb', albumsController.searchAndSaveAlbum);

module.exports = router;