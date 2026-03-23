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


async function searchAndSaveAlbum(req, res) {
  const { title, artist } = req.query;

  if (!title) {
    return res.status(400).json({ error: "Falta parámetro title" });
  }

  try {
    const result = await albumsService.searchAndSaveAlbum(title, artist);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAlbums, searchAndSaveAlbum };