const express = require('express');
const router = express.Router();
const listensController = require('../controllers/listensController');
const requireAuth = require('../middleware/requireAuth');

//ruta para registrar una escucha
router.post('/', requireAuth, listensController.addListen);

//ruta para obtener las escuchas de un usuario
router.get('/:user_id', listensController.getUserListens);

module.exports = router;