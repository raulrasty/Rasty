const { getSongsByAlbum } = require('../services/songsService');

async function getAlbumSongs(req, res) {
  const albumId = req.params.album_id;
  try {
    const songs = await getSongsByAlbum(albumId);
    res.json({ songs }); // devolver solo un array limpio
  } catch (err) {
    console.error('Error en SongsController:', err);
    res.status(500).json({ error: 'Error al obtener canciones' });
  }
}

module.exports = {
  getAlbumSongs,
};