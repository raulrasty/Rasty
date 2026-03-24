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
    .insert([{ id: data.user.id, username }]); // ✅ solo username

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

// OBTENER USUARIO POR ID
async function getUserById(userId) {
  const { data: user, error } = await supabase
    .from("users")
    .select('id, email, username, avatar_url, bio, location, birth_date, role, created_at')
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Usuario no encontrado");

  // Contar escuchas
  const { count, error: countError } = await supabase
    .from("listens")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw new Error(countError.message);

  return {
    ...user,
    total_listens: count,
  };
}

module.exports = { register, login, getUserById };
