async function getItunesPreview(title, artist) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const response = await fetch(
    `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }
  );

  if (!response.ok) {
    console.log(`iTunes respondió con status ${response.status}`);
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.log('iTunes no devolvió JSON:', contentType);
    return null;
  }

  const data = await response.json();
  return data.results?.[0]?.previewUrl || null;
}

module.exports = { getItunesPreview };