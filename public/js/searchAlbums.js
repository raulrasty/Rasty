const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');
const pagination = document.getElementById('albums-pagination');

let currentArtistId = null;
let currentArtistName = null;
let currentTitle = null;
let currentPage = 1;

function renderAlbums(results, total, page, totalPages) {
  if (!Array.isArray(results) || results.length === 0) {
    albumsContainer.innerHTML = '<p class="state-msg">No se encontraron álbumes.</p>';
    pagination.innerHTML = '';
    return;
  }

  albumsContainer.innerHTML = '';
  albumsContainer.className = 'albums';

  results.forEach(({ album }) => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.setAttribute('role', 'article');

    const img = document.createElement('img');
    img.src = album.cover_url || 'https://via.placeholder.com/200?text=Sin+portada';
    img.alt = `Portada de ${album.title}`;
    img.onerror = () => img.src = 'https://via.placeholder.com/200?text=Sin+portada';

    const title = document.createElement('h4');
    title.textContent = album.title;

    const artist = document.createElement('p');
    artist.textContent = album.artist;

    const spacer = document.createElement('div');
    spacer.className = 'album-card-spacer';
    spacer.setAttribute('aria-hidden', 'true');

    const btnGroup = document.createElement('div');
    btnGroup.className = 'album-card-buttons';

    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver álbum';
    btnVer.className = 'btn-ver-album';
    btnVer.setAttribute('aria-label', `Ver álbum ${album.title} de ${album.artist}`);
    btnVer.addEventListener('click', () => viewAlbum(album.id));
    btnGroup.appendChild(btnVer);

    if (isLoggedIn()) {
      const btnListen = document.createElement('button');
      btnListen.textContent = 'Crear escucha';
      btnListen.className = 'btn-crear-escucha';
      btnListen.setAttribute('aria-label', `Crear escucha de ${album.title}`);
      btnListen.addEventListener('click', () => goCreateListen(album.id));
      btnGroup.appendChild(btnListen);

      const favBtn = document.createElement('button');
      favBtn.textContent = '⭐ Favorito';
      favBtn.className = 'fav-album-btn';
      favBtn.setAttribute('aria-label', `Añadir ${album.title} a favoritos`);
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

  renderPagination(page, totalPages);
}

function renderPagination(page, totalPages) {
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '←';
  prevBtn.setAttribute('aria-label', 'Página anterior');
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener('click', () => goToPage(page - 1));

  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `${page} de ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '→';
  nextBtn.setAttribute('aria-label', 'Página siguiente');
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener('click', () => goToPage(page + 1));

  if (page > 1) pagination.appendChild(prevBtn);
  pagination.appendChild(info);
  if (page < totalPages) pagination.appendChild(nextBtn);
}

async function goToPage(page) {
  currentPage = page;
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const query = new URLSearchParams({ artist: currentArtistName, page, limit: 6 });
    if (currentArtistId) query.append('artistId', currentArtistId);
    if (currentTitle) query.append('title', currentTitle);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const data = await res.json();
    renderAlbums(data.results, data.total, data.page, data.totalPages);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error cargando álbumes.</p>';
  }
}

function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1A5 + c.charCodeAt(0)))
    .join('');
}

function renderCandidates(candidates, title) {
  albumsContainer.className = 'candidates-container';
  albumsContainer.innerHTML = `
    <p class="candidates-title">Se encontraron varios artistas con ese nombre. ¿Cuál buscas?</p>
    <div id="candidates-list" role="list"></div>
  `;
  pagination.innerHTML = '';

  const candidatesList = document.getElementById('candidates-list');

  candidates.forEach(candidate => {
    const btn = document.createElement('button');
    btn.className = 'candidate-btn';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `${candidate.name}${candidate.disambiguation ? `, ${candidate.disambiguation}` : ''}${candidate.country ? `, ${candidate.country}` : ''}`);

    const flag = candidate.country
      ? `<img src="https://flagcdn.com/24x18/${candidate.country.toLowerCase()}.png" alt="Bandera de ${candidate.country}" class="candidate-flag-img">`
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

async function searchByArtistId(artistId, artistName, title) {
  currentArtistId = artistId;
  currentArtistName = artistName;
  currentTitle = title;
  currentPage = 1;

  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';

  try {
    const query = new URLSearchParams({ artistId, artist: artistName, page: 1, limit: 6 });
    if (title) query.append('title', title);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const data = await res.json();
    renderAlbums(data.results, data.total, data.page, data.totalPages);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando álbumes.</p>';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const artist = document.getElementById('artist').value.trim();
  const title = document.getElementById('title').value.trim();

  currentTitle = title;
  currentPage = 1;
  currentArtistId = null;
  currentArtistName = artist;

  if (!artist) {
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Introduce el nombre de un artista.</p>';
    pagination.innerHTML = '';
    return;
  }

  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';

  try {
    const query = new URLSearchParams({ artist, page: 1, limit: 6 });
    if (title) query.append('title', title);

    const res = await fetch(`http://localhost:3000/albums/search-mb?${query}`);
    const data = await res.json();

    if (data.disambiguation) {
      renderCandidates(data.candidates, title);
      return;
    }

    renderAlbums(data.results, data.total, data.page, data.totalPages);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando álbumes.</p>';
  }
});

function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const artistParam = params.get("artist");
  if (artistParam) {
    document.getElementById("artist").value = artistParam;
    form.dispatchEvent(new Event("submit"));
  }
});