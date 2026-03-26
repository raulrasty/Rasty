const supabase = require('../config/supabaseClient');

async function requireAuth(req, res, next) {

  // Obtener token del header "Authorization"
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  // Extraer token (Bearer TOKEN)
  const token = authHeader.split(' ')[1];

  // Consultar Supabase para obtener usuario con ese token
  const { data, error } = await supabase.auth.getUser(token);

  // Ver que devuelve Supabase
  console.log("DATA:", data);
  console.log("ERROR:", error)

  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });

   // Guardar info del usuario en req para rutas posteriores
  req.user = data.user;
  req.userId = data.user.id;
  next();
}

module.exports = requireAuth;