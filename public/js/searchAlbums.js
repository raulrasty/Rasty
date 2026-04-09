const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');

// Función para renderizar los álbumes
function renderAlbums(results) {
  if (!Array.isArray(results) || results.length === 0) {
    albumsContainer.innerHTML = '<p class="state-msg">No se encontraron álbumes.</p>';
    return;
  }

  albumsContainer.innerHTML = '';
  albumsContainer.className = 'albums';

  results.forEach(({ album }) => {
    const card = document.createElement('div');
    card.className = 'album-card';

    const img = document.createElement('img');
    img.src = album.cover_url || 'https://via.placeholder.com/200?text=Sin+portada';
    img.alt = album.title;
    img.onerror = () => img.src = 'https://via.placeholder.com/200?text=Sin+portada';

    const title = document.createElement('h4');
    title.textContent = album.title;

    const artist = document.createElement('p');
    artist.textContent = album.artist;

    const spacer = document.createElement('div');
    spacer.className = 'album-card-spacer';

    const btnGroup = document.createElement('div');
    btnGroup.className = 'album-card-buttons';

    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver álbum';
    btnVer.className = 'btn-ver-album';
    btnVer.addEventListener('click', () => viewAlbum(album.id));
    btnGroup.appendChild(btnVer);

    if (isLoggedIn()) {
      const btnListen = document.createElement('button');
      btnListen.textContent = 'Crear escucha';
      btnListen.className = 'btn-crear-escucha';
      btnListen.addEventListener('click', () => goCreateListen(album.id));
      btnGroup.appendChild(btnListen);

      const favBtn = document.createElement('button');
      favBtn.textContent = '⭐ Favorito';
      favBtn.className = 'fav-album-btn';
      favBtn.addEventListener('click', () => openFavSlotSelector(album));
      btnGroup.appendChild(favBtn);
    }

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(artist);
    card.appendChild(spacer);
    card.appendChild(btnGroup);
    albumsContainer.appendChild(card);
  });
}
// Convertir código de país a emoji de bandera
function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  const flag = countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1A5 + c.charCodeAt(0)))
    .join('');
  console.log('Flag para', countryCode, ':', flag);
  return flag;
}
// Función para mostrar candidatos cuando hay varios artistas con el mismo nombre
function renderCandidates(candidates, title) {
  albumsContainer.className = 'candidates-container';
  albumsContainer.innerHTML = `
    <p class="candidates-title">Se encontraron varios artistas con ese nombre. ¿Cuál buscas?</p>
    <div id="candidates-list"></div>
  `;

  const candidatesList = document.getElementById('candidates-list');

  candidates.forEach(candidate => {
    console.log('País:', candidate.country);
    const btn = document.createElement('button');
    btn.className = 'candidate-btn';

    const flag = candidate.country
      ? `<img src="https://flagcdn.com/24x18/${candidate.country.toLowerCase()}.png" alt="${candidate.country}" class="candidate-flag-img">`
      : '';

    btn.innerHTML = `
      ${flag}
      <div>
        <strong>${candidate.name}</strong>
        ${candidate.disambiguation ? `<span> — ${candidate.disambiguation}</span>` : ''}
        ${candidate.country ? `<span> (${candidate.country})</span>` : ''}
      </div>
    `;

    btn.addEventListener('click', () => searchByArtistId(candidate.id, candidate.name, title));
    candidatesList.appendChild(btn);
  });
}


// Búsqueda por ID del artista
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

function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}