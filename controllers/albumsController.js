require('dotenv').config();
const albumsService = require('../services/albumsService');

// Obtener todos los álbumes
async function getAlbums(req, res) {
  try {
    const albums = await albumsService.getAllAlbums();
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Buscar y guardar álbumes desde MusicBrainz
async function searchAndSaveAlbums(req, res) {
  const { title, artist, artistId } = req.query; // ✅ acepta artistId

  try {
    if (!artist && !artistId) {
      return res.status(400).json({ error: "Debes proporcionar al menos un artista" });
    }
    if (title && !artist && !artistId) {
      return res.status(400).json({ error: "Si buscas por título, indica también el artista" });
    }

    const results = await albumsService.searchAndSaveAlbums(title, artist, artistId);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAlbums, searchAndSaveAlbums };