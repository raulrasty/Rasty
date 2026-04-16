const itunesService = require('../services/itunesService');

async function getPreview(req, res) {
  const { title, artist } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: 'Faltan parámetros title y artist' });
  }

  try {
    const previewUrl = await itunesService.getItunesPreview(title, artist);
    res.json({ previewUrl });
  } catch (err) {
    console.error('Error iTunes:', err.message);
    res.json({ previewUrl: null });
  }
}

module.exports = { getPreview };