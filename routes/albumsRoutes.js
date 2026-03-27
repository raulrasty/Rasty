const express = require('express');
const router = express.Router();

const albumsController = require('../controllers/albumsController');

//ruta para obtener todos los albumes
router.get('/', albumsController.getAlbums);


//ruta para buscar y guardar un album desde  MusicBrainz
router.get('/search-mb', albumsController.searchAndSaveAlbums);

module.exports = router;