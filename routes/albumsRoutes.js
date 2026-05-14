const express = require('express');
const router = express.Router();
const albumsController = require('../controllers/albumsController');

// Obtener todos los álbumes
router.get('/', albumsController.getAlbums);

// Buscar álbumes (primero en DB, si no hay devuelve needsMusicBrainz: true)
router.get('/search-mb', albumsController.searchAndSaveAlbums);

// Recibir álbumes desde el frontend y guardarlos en Supabase
router.post('/save-from-frontend', albumsController.saveFromFrontend);

module.exports = router;