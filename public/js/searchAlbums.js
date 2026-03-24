const session = JSON.parse(localStorage.getItem('session'));
const isLoggedIn = !!session?.access_token;

const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const artist = document.getElementById('artist').value.trim();
  const title = document.getElementById('title').value.trim();
  albumsContainer.innerHTML = '<p>Cargando resultados...</p>';

  try {
    const query = new URLSearchParams({ artist });
    if (title) query.append('title', title);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const results = await res.json();

    if (!Array.isArray(results) || results.length === 0) {
      albumsContainer.innerHTML = '<p>No se encontraron álbumes.</p>';
      return;
    }

    albumsContainer.innerHTML = '';
    results.forEach(({ album }) => {
      const card = document.createElement('div');
      card.className = 'album-card';
      card.innerHTML = `
        <img src="${album.cover_url}" alt="${album.title}" onerror="this.src='https://via.placeholder.com/200?text=Sin+portada'">
        <h4>${album.title}</h4>
        <p>${album.artist}</p>
        <button onclick="viewAlbum('${album.id}')">Ver álbum</button>
        ${isLoggedIn ? `<button onclick="createListen('${album.id}')">Crear Escucha</button>` : ''}
      `;
      albumsContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p>Error buscando álbumes.</p>';
  }
});

function viewAlbum(albumId) {
  // Redirige a la página de detalle con query param
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

function createListen(albumId) {
  // Redirige a la página de registro de escucha con album_id
  window.location.href = `/createListen.html?album_id=${albumId}`;
}