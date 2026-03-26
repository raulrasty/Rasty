const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/upload');

//ruta para registrarse
router.post('/register', usersController.register);
//ruta para loguearse
router.post('/login', usersController.login);
//ruta para  buscar a usuarios
router.get('/search', usersController.searchUsersController);
//ruta para obtener la info de un usuario
router.get('/:user_id', usersController.getUserByIdController);
//ruta para editar los datos de tu usuario
router.put('/:user_id', requireAuth, upload.single('avatar'), usersController.updateUserController);

module.exports = router;