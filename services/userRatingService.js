const supabase = require('../config/supabaseClient');

// Obtener distribución de ratings que ha dado un usuario
async function getUserRatingDistribution(userId) {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('rating')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const distribution = {};
  [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach(v => distribution[v] = 0);
  data.forEach(r => {
    if (distribution[r.rating] !== undefined) distribution[r.rating]++;
  });

  const total = data.length;
  const average = total > 0
    ? Math.round(data.reduce((sum, r) => sum + r.rating, 0) / total * 10) / 10
    : null;

  return { distribution, total, average };
}

module.exports = { getUserRatingDistribution };