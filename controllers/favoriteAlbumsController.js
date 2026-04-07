const favoriteAlbumsService = require('../services/favoriteAlbumsService');

// Obtener álbumes favoritos de un usuario
async function getFavoriteAlbums(req, res) {
  const { userId } = req.params;

  try {
    const albums = await favoriteAlbumsService.getFavoriteAlbums(userId);
    res.json(albums);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Guardar álbumes favoritos del usuario logueado
async function saveFavoriteAlbums(req, res) {
  const userId = req.user.id;
  const { albums } = req.body;

  try {
    const result = await favoriteAlbumsService.saveFavoriteAlbums(userId, albums);
    res.json({ message: "Álbumes favoritos guardados", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getFavoriteAlbums, saveFavoriteAlbums };