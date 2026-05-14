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

// Buscar álbumes — primero en DB, si no hay devuelve needsMusicBrainz: true
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

// Recibir álbumes procesados desde el frontend y guardarlos en Supabase
async function saveFromFrontend(req, res) {
  const { albums, page, limit } = req.body;

  try {
    if (!albums || !Array.isArray(albums) || albums.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron álbumes" });
    }

    const results = await albumsService.saveFromFrontend(albums, page || 1, limit || 6);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAlbums, searchAndSaveAlbums, saveFromFrontend };