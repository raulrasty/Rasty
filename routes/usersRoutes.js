const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/upload');

router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.get('/search', usersController.searchUsersController);
router.get('/:user_id', usersController.getUserByIdController);
router.put('/:user_id', requireAuth, upload.single('avatar'), usersController.updateUserController);

module.exports = router;