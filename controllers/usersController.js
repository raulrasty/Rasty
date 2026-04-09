
const usersService = require("../services/usersService");
const supabase = require("../config/supabaseClient");


// REGISTER

async function register(req, res) {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const result = await usersService.register(email, password, username);
    res.status(201).json(result);
  } catch (err) {
    const status = err.status || 400;
    const message = err.message || "Error al registrar usuario";
    res.status(status).json({ error: message });
  }
}

// LOGIN

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const result = await usersService.login(email, password);
    res.json(result);
  } catch (err) {
    const status = err.status || 401;
    const message = err.message || "Error al iniciar sesión";
    res.status(status).json({ error: message });
  }
}

//Buscar usuarios
async function searchUsersController(req, res) {
  const { username } = req.query;
 
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Debes introducir un nombre de usuario" });
  }
 
  try {
    const users = await usersService.searchUsersService(username.trim());
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}



//Obetener usuario por id

async function getUserByIdController(req, res) {
  const { user_id } = req.params;
  console.log("Buscando usuario con ID:", user_id);

  try {
    const user = await usersService.getUserByIdService(user_id);
    res.json(user);
  } catch (err) {
    console.error("Error en getUserById:", err.message);
    res.status(404).json({ error: err.message });
  }
}

//Actualizar info del usuario

async function updateUserController(req, res) {
  try {
    const userId = req.userId; // 
    const updates = { ...req.body };
 

    if (req.file) {
      const fileName = `${userId}-${Date.now()}`; 
 
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
 
      if (uploadError) throw uploadError;
 
     
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
 
      updates.avatar_url = urlData.publicUrl;
    }
 
    const updatedUser = await usersService.updateUserService(userId, updates);
    res.json(updatedUser);
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  getUserByIdController,
  updateUserController,
  searchUsersController
};
