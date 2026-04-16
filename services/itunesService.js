async function getItunesPreview(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
  const data = await response.json();
  return data.results?.[0]?.previewUrl || null;
}

module.exports = { getItunesPreview };