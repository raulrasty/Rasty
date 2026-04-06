const favoriteSongsService = require('../services/favoriteSongsService');

// Guardar canciones favoritas de un listen
async function saveListenFavoriteSongs(req, res) {
  const { listenId } = req.params;
  const userId = req.user.id;
  const { songIds } = req.body;

  try {
    const result = await favoriteSongsService.saveListenFavoriteSongs(listenId, userId, songIds);
    res.json({ message: "Canciones favoritas guardadas", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener canciones favoritas de un listen
async function getListenFavoriteSongs(req, res) {
  const { listenId } = req.params;

  try {
    const songs = await favoriteSongsService.getListenFavoriteSongs(listenId);
    res.json(songs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Guardar canciones favoritas de un álbum
async function saveAlbumFavoriteSongs(req, res) {
  const { albumId } = req.params;
  const userId = req.user.id;
  const { songIds } = req.body;

  try {
    const result = await favoriteSongsService.saveAlbumFavoriteSongs(albumId, userId, songIds);
    res.json({ message: "Canciones favoritas guardadas", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Obtener canciones favoritas de un álbum para el usuario logueado
async function getAlbumFavoriteSongs(req, res) {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    const songs = await favoriteSongsService.getAlbumFavoriteSongs(albumId, userId);
    res.json(songs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  saveListenFavoriteSongs,
  getListenFavoriteSongs,
  saveAlbumFavoriteSongs,
  getAlbumFavoriteSongs
};