// controllers/usersController.js
const usersService = require('../services/usersService');

// --------------------
// REGISTER
// --------------------
async function register(req, res) {
  const { email, password, username } = req.body; // quitar avatar_url, bio, etc.

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await usersService.register(email, password, username); // ✅ pasa username directo
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
// --------------------
// LOGIN
// --------------------
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const result = await usersService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

// --------------------
// GET USER PROFILE BY ID
// --------------------
async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const user = await usersService.getUserById(id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// --------------------
// EXPORT
// --------------------
module.exports = {
  register,
  login,
  getUserById
};