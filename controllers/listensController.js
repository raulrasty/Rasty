const listensService = require('../services/listensService');


//Funcion añadir una escucha
async function addListen(req, res) {
  console.log("req.user:", req.user); 
  
  const { album_id, rating, liked, review, listen_date } = req.body;
  const userId = req.user?.id;

  if (!userId || !album_id) {
    return res.status(400).json({ error: "Faltan parámetros obligatorios (usuario o album_id)" });
  }

  try {
    const listen = await listensService.createListen(userId, {
      albumId: album_id,
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

//Funcion obtener las escuchas de un usuario
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

async function deleteListen(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await listensService.deleteListen(id, userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: err.message });
  }
}

// Editar una escucha
async function updateListen(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { rating, liked, review, listen_date } = req.body;

  try {
    const listen = await listensService.updateListen(id, userId, { rating, liked, review, listen_date });
    res.json({ message: "Escucha actualizada", listen });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: err.message });
  }
}

async function getUserAlbums(req, res) {
  const { user_id } = req.params;

  try {
    const albums = await listensService.getAlbumsByUser(user_id);
    res.json(albums);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getUserListensPaginated(req, res) {
  const { user_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const result = await listensService.getListensByUserPaginated(user_id, page, limit);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addListen, getUserListens, deleteListen, updateListen, getUserAlbums, getUserListensPaginated };



