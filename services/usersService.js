const supabase = require('../config/supabaseClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// REGISTRO
async function register(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashedPassword }])
    .select();

  if (error) throw new Error(error.message);

  return data[0];
}

// LOGIN
async function login(email, password) {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  if (error) throw new Error(error.message);
  if (!users || users.length === 0) throw new Error('Usuario no encontrado');

  const user = users[0];

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error('Contraseña incorrecta');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' } // token válido 7 días
  );

  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

module.exports = { register, login };