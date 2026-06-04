// VARIABLES DE ESTADO Y SELECTORES
const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');
const pagination = document.getElementById('albums-pagination');

const PLACEHOLDER = 'https://placehold.co/200x200?text=Sin+portada';
const LIMIT = 6;

let currentArtistId = null;
let currentArtistName = null;
let currentTitle = null;
let currentPage = 1;

// ====================== RENDERIZADO ======================

function renderAlbumCard(album) {
  const card = document.createElement('div');
  card.className = 'album-card';
  card.setAttribute('role', 'article');

  const img = document.createElement('img');
  img.src = album.cover_url || PLACEHOLDER;
  img.alt = `Portada de ${album.title}`;
  img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };

  const title = document.createElement('h4');
  title.textContent = album.title;

  const artist = document.createElement('p');
  artist.textContent = album.artist;

  const year = document.createElement('p');
  year.textContent = album.release_year || '';
  year.className = 'album-year';

  const spacer = document.createElement('div');
  spacer.className = 'album-card-spacer';
  spacer.setAttribute('aria-hidden', 'true');

  const btnGroup = document.createElement('div');
  btnGroup.className = 'album-card-buttons';

  const btnVer = document.createElement('button');
  btnVer.textContent = 'Ver álbum';
  btnVer.className = 'btn-ver-album';
  btnVer.setAttribute('aria-label', `Ver álbum ${album.title}`);
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
  card.appendChild(year);
  card.appendChild(spacer);
  card.appendChild(btnGroup);
  return card;
}

function renderSection(container, title, results, total, page, totalPages, type) {
  if (!results || results.length === 0) return;

  const section = document.createElement('div');
  section.className = 'category-section';

  const heading = document.createElement('h2');
  heading.className = 'category-title';
  heading.textContent = title;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'albums';
  results.forEach(({ album }) => grid.appendChild(renderAlbumCard(album)));
  section.appendChild(grid);

  // Paginación de la categoría
  if (totalPages > 1) {
    const pag = document.createElement('div');
    pag.className = 'pagination';

    if (page > 1) {
      const prev = document.createElement('button');
      prev.className = 'pagination-btn';
      prev.textContent = '←';
      prev.setAttribute('aria-label', 'Página anterior');
      prev.addEventListener('click', () => goToPage(page - 1, type));
      pag.appendChild(prev);
    }

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `${page} de ${totalPages}`;
    pag.appendChild(info);

    if (page < totalPages) {
      const next = document.createElement('button');
      next.className = 'pagination-btn';
      next.textContent = '→';
      next.setAttribute('aria-label', 'Página siguiente');
      next.addEventListener('click', () => goToPage(page + 1, type));
      pag.appendChild(next);
    }

    section.appendChild(pag);
  }

  container.appendChild(section);
}

function renderResults(data) {
  albumsContainer.innerHTML = '';
  albumsContainer.className = 'results-container';
  pagination.innerHTML = '';

  const hasAlbums = data.albums && data.albums.results && data.albums.results.length > 0;
  const hasEps = data.eps && data.eps.results && data.eps.results.length > 0;

  if (!hasAlbums && !hasEps) {
    albumsContainer.innerHTML = '<p class="state-msg">No se encontraron lanzamientos.</p>';
    return;
  }

  renderSection(albumsContainer, '🎵 Álbumes', data.albums.results, data.albums.total, data.albums.page, data.albums.totalPages, 'albums');
  renderSection(albumsContainer, '🎶 EPs', data.eps.results, data.eps.total, data.eps.page, data.eps.totalPages, 'eps');
}

function renderCandidates(candidates) {
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
    btn.setAttribute('aria-label', candidate.name);

    btn.innerHTML = `
      ${candidate.picture ? `<img src="${candidate.picture}" alt="${candidate.name}" class="candidate-avatar">` : ''}
      <strong>${candidate.name}</strong>
    `;

    btn.addEventListener('click', () => searchByArtistId(candidate.id, candidate.name));
    candidatesList.appendChild(btn);
  });
}

// ====================== NAVEGACIÓN ======================

async function goToPage(page, type) {
  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';

  try {
    const query = new URLSearchParams({ artist: currentArtistName, page, limit: LIMIT });
    if (currentArtistId) query.append('artistId', currentArtistId);
    if (currentTitle) query.append('title', currentTitle);

    const res = await fetch(`${API_BASE}/albums/search-mb?${query}`);
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error cargando resultados.</p>';
  }
}

async function searchByArtistId(artistId, artistName) {
  currentArtistId = artistId;
  currentArtistName = artistName;
  currentPage = 1;

  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';

  try {
    const query = new URLSearchParams({ artistId, artist: artistName, page: 1, limit: LIMIT });
    if (currentTitle) query.append('title', currentTitle);

    const res = await fetch(`${API_BASE}/albums/search-mb?${query}`);
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando resultados.</p>';
  }
}

// ====================== FORMULARIO ======================

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
    const query = new URLSearchParams({ artist, page: 1, limit: LIMIT });
    if (title) query.append('title', title);

    const res = await fetch(`${API_BASE}/albums/search-mb?${query}`);
    const data = await res.json();

    if (data.error) {
      albumsContainer.innerHTML = `<p class="state-msg" role="alert">${data.error}</p>`;
      return;
    }

    if (data.disambiguation) {
      renderCandidates(data.candidates);
      return;
    }

    renderResults(data);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando resultados.</p>';
  }
});

// ====================== REDIRECCIÓN ======================

function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}

// ====================== INICIALIZACIÓN ======================

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const artistParam = params.get('artist');
  if (artistParam) {
    document.getElementById('artist').value = artistParam;
    form.dispatchEvent(new Event('submit'));
  }
});