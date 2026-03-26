const { getSongsByAlbum } = require('../services/songsService');


//Funcion obtener canciones de un album
async function getAlbumSongs(req, res) {
  const albumId = req.params.album_id;
  try {
    const songs = await getSongsByAlbum(albumId);
    res.json({ songs }); 
  } catch (err) {
    console.error('Error en SongsController:', err);
    res.status(500).json({ error: 'Error al obtener canciones' });
  }
}

module.exports = {
  getAlbumSongs,
};