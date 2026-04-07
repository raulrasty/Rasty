const userRatingService = require('../services/userRatingService');

// Obtener distribución de ratings de un usuario
async function getUserRatingDistribution(req, res) {
  const { userId } = req.params;

  try {
    const data = await userRatingService.getUserRatingDistribution(userId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getUserRatingDistribution };