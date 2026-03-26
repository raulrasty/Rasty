
const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');


//Evento principal:buscar albumes
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const artist = document.getElementById('artist').value.trim();
  const title = document.getElementById('title').value.trim();
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';


  //parametros de busqueda
  try {
    const query = new URLSearchParams({ artist });
    if (title) query.append('title', title);

    //petición al back
    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const results = await res.json();

    //validad resultados
    if (!Array.isArray(results) || results.length === 0) {
      albumsContainer.innerHTML = '<p class="state-msg">No se encontraron álbumes.</p>';
      return;
    }

    //renderizado de los albumes
    albumsContainer.innerHTML = '';
    results.forEach(({ album }) => {
      const card = document.createElement('div');
      card.className = 'album-card';
      card.innerHTML = `
        <img src="${album.cover_url}" alt="${album.title}" onerror="this.src='https://via.placeholder.com/200?text=Sin+portada'">
        <h4>${album.title}</h4>
        <p>${album.artist}</p>
        <button onclick="viewAlbum('${album.id}')">Ver álbum</button>
        ${isLoggedIn() ? `<button onclick="goCreateListen('${album.id}')">Crear Escucha</button>` : ''}
      `;
      albumsContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg">Error buscando álbumes.</p>';
  }
});

//funcion para ir a la página de la info album
function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

//funcion para ir a la página de crear una escucha del album
function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}