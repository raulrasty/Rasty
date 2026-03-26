const albumInfoService = require("../services/albumInfoService");

//Función de conseguir la info de un album
async function getAlbum(req, res) {
  try {
    const { id } = req.params;

    const album = await albumInfoService.getAlbumById(id);

    res.json(album);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  getAlbum,
};
