const express = require('express');
const router = express.Router();
const listensController = require('../controllers/listensController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Registrar una escucha
router.post('/', authenticateToken, listensController.addListen);

// Obtener escuchas de un usuario
router.get('/:user_id', listensController.getUserListens);

module.exports = router;