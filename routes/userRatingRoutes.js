const express = require('express');
const router = express.Router();
const userRatingController = require('../controllers/userRatingController');

// Obtener distribución de ratings de un usuario
router.get('/:userId', userRatingController.getUserRatingDistribution);

module.exports = router;