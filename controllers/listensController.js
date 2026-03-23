const listensService = require('../services/listensService');

async function addListen(req, res) {
  const { title, artist, rating, liked, review, listen_date } = req.body;
  const userId = req.user.id; // viene del middleware

  if (!userId || !title) {
    return res.status(400).json({ error: "Faltan parámetros obligatorios (usuario o título del álbum)" });
  }

  try {
    const listen = await listensService.createListen(userId, {
      albumTitle: title,
      albumArtist: artist,
      rating,
      liked,
      review,
      listen_date
    });

    res.json({ message: "Escucha registrada", listen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
async function getUserListens(req, res) {
  const { user_id } = req.params;

  try {
    const listens = await listensService.getListensByUser(user_id);
    res.json(listens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addListen, getUserListens };