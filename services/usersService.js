const supabase = require("../config/supabaseClient");

// REGISTRO
async function register(email, password, username) {
  if (!username || username.length < 3) {
    throw new Error("El nombre de usuario debe tener al menos 3 caracteres");
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error("La contraseña debe tener mínimo 6 caracteres, al menos una mayúscula, una minúscula y un número");
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  const { error: profileError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, username }]); 

  if (profileError) throw new Error(profileError.message);

  return { message: 'Revisa tu correo para confirmar la cuenta' };
}


// LOGIN
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw new Error(error.message);

  return {
    session: data.session,
    user: data.user
  };
}

//OBTENER USUARIOS
async function searchUsersService(username) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, avatar_url, bio, location")
    .ilike("username", `%${username}%`); 
 
  if (error) throw new Error(error.message);
 
  return data;
}


// OBTENER USUARIO POR ID
async function getUserByIdService(user_id) {
  const { data: user, error } = await supabase
    .from("users")
    .select('*')
    .eq("id", user_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Usuario no encontrado");

  return user;
}
//ACTUALIZAR EL USUARIO
async function updateUserService(user_id, updates) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data || {};
}


module.exports = { register, login, getUserByIdService, updateUserService, searchUsersService };
