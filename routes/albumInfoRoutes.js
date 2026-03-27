const express = require('express');
const router = express.Router();
const albumInfoController = require('../controllers/albumInfoController');


//ruta para obtener la info de un album
router.get('/:id', albumInfoController.getAlbum);

module.exports = router;