const express = require('express');
const router = express.Router();
const listensController = require('../controllers/listensController');
const requireAuth = require('../middleware/requireAuth');

//ruta para registrar una escucha
router.post('/', requireAuth, listensController.addListen);

//ruta para obtener las escuchas de un usuario
router.get('/:user_id', listensController.getUserListens);

// Obtener escuchas propias, usado para editar escuchas
router.get('/user/:user_id', requireAuth, listensController.getUserListens);

// Eliminar una escucha (requiere auth)
router.delete('/:id', requireAuth, listensController.deleteListen);

// Editar una escucha (requiere auth)
router.put('/:id', requireAuth, listensController.updateListen);

module.exports = router;