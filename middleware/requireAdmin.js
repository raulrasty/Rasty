const supabase = require('../config/supabaseClient');

async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });

  // Verificar rol admin en tabla users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userError || !user) return res.status(401).json({ error: 'Usuario no encontrado' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  req.user = data.user;
  req.userId = data.user.id;
  next();
}

module.exports = requireAdmin;
