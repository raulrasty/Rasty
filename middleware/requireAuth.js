const supabase = require('../config/supabaseClient');

async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

   console.log("DATA:", data); // 👈 añade esto
  console.log("ERROR:", error)

  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });

  req.user = data.user;
  req.userId = data.user.id;
  next();
}

module.exports = requireAuth;