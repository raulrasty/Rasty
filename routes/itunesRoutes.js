const express = require('express');
const router = express.Router();
const itunesController = require('../controllers/itunesController');

router.get('/preview', itunesController.getPreview);

module.exports = router;