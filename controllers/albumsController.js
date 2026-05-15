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

// Recibir álbumes procesados desde el frontend y guardarlos
async function saveFromFrontend(req, res) {
  const { albums } = req.body;

  try {
    if (!albums || !Array.isArray(albums) || albums.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron álbumes" });
    }
    // Guardar y devolver los álbumes — sin paginación
    const results = await albumsService.saveFromFrontend(albums);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAlbums, searchAndSaveAlbums, saveFromFrontend };