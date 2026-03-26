require('dotenv').config();
const albumsService = require('../services/albumsService');

//Función para obtener todos los albumes
async function getAlbums(req, res) {
  try {
    const albums = await albumsService.getAllAlbums();
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
 

///Función de buscar y guardar album en la bbdd
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

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
 
module.exports = { getAlbums, searchAndSaveAlbums };
 