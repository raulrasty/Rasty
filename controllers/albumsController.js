require('dotenv').config();
const albumsService = require('../services/albumsService');

async function getAlbums(req, res) {
  try {
    const albums = await albumsService.getAllAlbums();
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function searchAndSaveAlbums(req, res) {
  const { title, artist, artistId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;

  try {
    if (!artist && !artistId) {
      return res.status(400).json({ error: "Debes proporcionar al menos un artista" });
    }
    const results = await albumsService.searchAndSaveAlbums(title, artist, artistId, page, limit);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// Proxy para obtener preview de Deezer evitando CORS
async function getDeezerPreview(req, res) {
  try {
    const { trackId } = req.params;
    const response = await fetch(`https://api.deezer.com/track/${trackId}`);
    const data = await response.json();
    res.json({ preview: data.preview || null });
  } catch (err) {
    res.status(500).json({ preview: null });
  }
}

module.exports = { getAlbums, searchAndSaveAlbums, getDeezerPreview };