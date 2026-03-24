const express = require('express');
const router = express.Router();
const albumInfoController = require('../controllers/albumInfoController');

router.get('/:id', albumInfoController.getAlbum);

module.exports = router;