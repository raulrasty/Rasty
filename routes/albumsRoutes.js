const express = require('express');
const router = express.Router();
const albumsController = require('../controllers/albumsController');

// Obtener todos los álbumes
router.get('/', albumsController.getAlbums);

// Buscar álbumes en Deezer y guardar en Supabase
router.get('/search-mb', albumsController.searchAndSaveAlbums);

// Proxy para obtener preview de una canción de Deezer (evita CORS)
router.get('/preview/:trackId', albumsController.getDeezerPreview);

module.exports = router;