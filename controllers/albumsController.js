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
  const { title, artist } = req.query;
 
  try {
    if (!artist && !title) {
      return res.status(400).json({ error: "Debes proporcionar al menos un artista o título de álbum" });
    }
    if (title && !artist) {
      return res.status(400).json({ error: "Si quieres buscar por título, debes indicar también el artista" });
    }
 
    const results = await albumsService.searchAndSaveAlbums(title, artist);
    // ✅  Devolvemos el array directamente para que el frontend pueda hacer Array.isArray()
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
 
module.exports = { getAlbums, searchAndSaveAlbums };
 