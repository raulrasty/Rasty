const supabase = require("../config/supabaseClient");

// REGISTRO
async function register(email, password, username) {
  if (!username || username.length < 3) {
    throw { status: 400, message: "El nombre de usuario debe tener al menos 3 caracteres" };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    throw { status: 400, message: "La contraseña debe tener mínimo 6 caracteres, al menos una mayúscula, una minúscula y un número" };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message === "User already registered") {
      throw { status: 409, message: "Ya existe una cuenta con ese correo electrónico" };
    }
    throw { status: 400, message: error.message };
  }

  const { error: profileError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, username }]);

  if (profileError) {
    console.error('Error insertando en public.users:', profileError);
    if (profileError.message.includes('duplicate') || profileError.code === '23505') {
      throw { status: 409, message: "Ese nombre de usuario ya está en uso" };
    }
    throw { status: 400, message: profileError.message };
  }

  return { message: 'Revisa tu correo para confirmar la cuenta' };
}


// LOGIN
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      throw { status: 401, message: "Email o contraseña incorrectos" };
    }
    if (error.message === "Email not confirmed") {
      throw { status: 401, message: "Debes confirmar tu correo electrónico antes de iniciar sesión" };
    }
    throw { status: 401, message: error.message };
  }

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
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data || {};
}

// ELIMINAR CUENTA PROPIA
async function deleteAccountService(userId) {
  // Eliminar de public.users (el cascade se encarga del resto)
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  // Eliminar de auth.users
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  return { message: 'Cuenta eliminada correctamente' };
}

// ELIMINAR CUENTA DE OTRO USUARIO (solo admin)
async function deleteUserByAdminService(adminId, targetUserId) {
  // Verificar que el que hace la petición es admin
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('role')
    .eq('id', adminId)
    .maybeSingle();

  if (adminError) throw new Error(adminError.message);
  if (!admin || admin.role !== 'admin') {
    throw { status: 403, message: 'No tienes permisos para realizar esta acción' };
  }

  // Eliminar de public.users
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', targetUserId);

  if (profileError) throw new Error(profileError.message);

  // Eliminar de auth.users
  const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
  if (authError) throw new Error(authError.message);

  return { message: 'Usuario eliminado correctamente' };
}

module.exports = { register, login, getUserByIdService, updateUserService, searchUsersService, deleteAccountService, deleteUserByAdminService };