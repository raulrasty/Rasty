const albumRatingsService = require('../services/albumRatingsService');

// Guardar o actualizar rating del usuario
async function saveAlbumRating(req, res) {
  const { albumId } = req.params;
  const userId = req.user.id;
  const { rating } = req.body;

  if (!rating) return res.status(400).json({ error: "Falta el rating" });

  try {
    const result = await albumRatingsService.saveAlbumRating(albumId, userId, rating);
    res.json({ message: "Rating guardado", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener rating del usuario para un álbum
async function getAlbumRating(req, res) {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    const rating = await albumRatingsService.getAlbumRating(albumId, userId);
    res.json({ rating });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener media de ratings
async function getAlbumAverageRating(req, res) {
  const { albumId } = req.params;

  try {
    const average = await albumRatingsService.getAlbumAverageRating(albumId);
    res.json({ average });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener distribución de ratings para la gráfica
async function getAlbumRatingDistribution(req, res) {
  const { albumId } = req.params;

  try {
    const data = await albumRatingsService.getAlbumRatingDistribution(albumId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener ratings de usuarios seguidos
async function getFollowingRatings(req, res) {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    const ratings = await albumRatingsService.getFollowingRatings(albumId, userId);
    res.json(ratings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  saveAlbumRating,
  getAlbumRating,
  getAlbumAverageRating,
  getAlbumRatingDistribution,
  getFollowingRatings
};