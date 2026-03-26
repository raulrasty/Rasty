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

module.exports = { addListen, getUserListens };