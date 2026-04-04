const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');

// Función para renderizar los álbumes
function renderAlbums(results) {
  if (!Array.isArray(results) || results.length === 0) {
    albumsContainer.innerHTML = '<p class="state-msg">No se encontraron álbumes.</p>';
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
      ${isLoggedIn() ? `<button onclick="goCreateListen('${album.id}')">Crear Escucha</button>` : ''}
    `;
    albumsContainer.appendChild(card);
  });
}

// Función para mostrar candidatos cuando hay varios artistas con el mismo nombre
function renderCandidates(candidates, title) {
  albumsContainer.innerHTML = `
    <p class="state-msg">Se encontraron varios artistas con ese nombre. ¿Cuál buscas?</p>
    <div id="candidates-list"></div>
  `;

  const candidatesList = document.getElementById('candidates-list');

  candidates.forEach(candidate => {
    const btn = document.createElement('button');
    btn.className = 'candidate-btn';
    btn.innerHTML = `
      <strong>${candidate.name}</strong>
      ${candidate.disambiguation ? `<span> — ${candidate.disambiguation}</span>` : ''}
      ${candidate.country ? `<span> (${candidate.country})</span>` : ''}
    `;
    btn.addEventListener('click', () => searchByArtistId(candidate.id, candidate.name, title));
    candidatesList.appendChild(btn);
  });
}

// Búsqueda por ID del artista una vez el usuario ha elegido
async function searchByArtistId(artistId, artistName, title) {
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';

  try {
    const query = new URLSearchParams({ artistId, artist: artistName });
    if (title) query.append('title', title);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const results = await res.json();

    renderAlbums(results);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg">Error buscando álbumes.</p>';
  }
}

// Evento principal: buscar álbumes
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const artist = document.getElementById('artist').value.trim();
  const title = document.getElementById('title').value.trim();
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';

  try {
    const query = new URLSearchParams({ artist });
    if (title) query.append('title', title);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const data = await res.json();

    // Si hay varios artistas con el mismo nombre, mostrar candidatos
    if (data.disambiguation) {
      renderCandidates(data.candidates, title);
      return;
    }

    renderAlbums(data);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg">Error buscando álbumes.</p>';
  }
});

// Función para ir a la página de info del álbum
function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

// Función para ir a la página de crear una escucha
function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}