// VARIABLES DE ESTADO Y SELECTORES
const form = document.getElementById('search-form');
const albumsContainer = document.getElementById('albums');
const pagination = document.getElementById('albums-pagination');

const MB_BASE = 'https://musicbrainz.org/ws/2';
const MB_HEADERS = { 'User-Agent': 'RastyApp/1.0' };

const TITLE_BLACKLIST = ['sampler', 'bootleg', 'promo', 'rehearsal', 'outtakes'];
const BAD_SECONDARY = [
  'Compilation', 'Live', 'Remix', 'Soundtrack',
  'Interview', 'Spokenword', 'Audiobook', 'Audio drama', 'Mixtape/Street', 'Demo'
];

let currentArtistId = null;
let currentArtistName = null;
let currentTitle = null;
let currentPage = 1;
let allFilteredReleaseGroups = [];

// musicbrainz

function normalizeStr(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

async function fetchMB(url) {
  const res = await fetch(url, { headers: MB_HEADERS });
  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`);
  return res.json();
}

async function searchArtistMB(artistName) {
  const data = await fetchMB(`${MB_BASE}/artist/?query=artist:"${encodeURIComponent(artistName)}"&fmt=json&limit=5`);
  return data.artists || [];
}

async function getReleaseGroupsMB(artistId) {
  let all = [];
  let offset = 0;
  while (true) {
    const data = await fetchMB(`${MB_BASE}/release-group?artist=${artistId}&type=album&fmt=json&limit=100&offset=${offset}`);
    if (!data['release-groups']?.length) break;
    all.push(...data['release-groups']);
    if (data['release-groups'].length < 100) break;
    offset += 100;
  }
  return all;
}

function filterReleaseGroups(rgs, title) {
  return rgs.filter(rg => {
    if (rg['primary-type'] !== 'Album') return false;
    if (rg['secondary-types']?.some(t => BAD_SECONDARY.includes(t))) return false;
    const rgTitle = rg.title.toLowerCase();
    if (TITLE_BLACKLIST.some(w => new RegExp(`\\b${w}\\b`).test(rgTitle))) return false;
    if (/^\[.*\]$/.test(rg.title.trim()) || /^\(.*\)$/.test(rg.title.trim())) return false;
    if (title && !normalizeStr(rg.title).includes(normalizeStr(title))) return false;
    return true;
  }).sort((a, b) => {
    const ya = a['first-release-date'] ? parseInt(a['first-release-date']) : 0;
    const yb = b['first-release-date'] ? parseInt(b['first-release-date']) : 0;
    return ya - yb;
  });
}

async function getBestRelease(rgId) {
  try {
    const data = await fetchMB(`${MB_BASE}/release/?release-group=${rgId}&status=official&fmt=json&limit=5`);
    return data.releases?.find(r => r.status === 'Official') || data.releases?.[0] || null;
  } catch { return null; }
}

async function getTracksMB(releaseId) {
  try {
    const data = await fetchMB(`${MB_BASE}/release/${releaseId}?inc=recordings&fmt=json`);
    return data.media?.flatMap(m => m.tracks.map(t => ({
      position: t.position,
      title: t.title,
      length: t.length || null,
    }))) || [];
  } catch { return []; }
}

async function processPage(rgs, page, limit, artistName) {
  const total = rgs.length;
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit;
  const paginated = rgs.slice(from, from + limit);

  const albumsToSave = [];

  for (const rg of paginated) {
    const rgId = rg.id;
    const releaseYear = rg['first-release-date'] ? parseInt(rg['first-release-date'].split('-')[0]) : null;
    const artist = rg['artist-credit']?.map(ac => (ac.name || ac.artist?.name || '') + (ac.joinphrase || '')).join('') || artistName;

    const bestRelease = await getBestRelease(rgId);
    const releaseId = bestRelease?.id || null;
    const releaseDate = bestRelease?.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? bestRelease.date : null;
    const coverUrl = `https://coverartarchive.org/release-group/${rgId}/front`;

    let tracks = [];
    if (releaseId) tracks = await getTracksMB(releaseId);

    albumsToSave.push({ rgId, title: rg.title, artist, releaseYear, releaseDate, coverUrl, tracks });
  }

  const res = await fetch(`${API_BASE}/albums/save-from-frontend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ albums: albumsToSave, page, limit }),
  });

  if (!res.ok) throw new Error('Error guardando álbumes en el servidor');
  const data = await res.json();

  return { ...data, total, totalPages };
}

// renderizado

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

// navegación

async function goToPage(page) {
  currentPage = page;
  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    if (allFilteredReleaseGroups.length > 0) {
      const data = await processPage(allFilteredReleaseGroups, page, 6, currentArtistName);
      renderAlbums(data.results, data.total, page, data.totalPages);
      return;
    }
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error cargando álbumes.</p>';
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error cargando álbumes.</p>';
  }
}

function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode.toUpperCase().split('').map(c => String.fromCodePoint(0x1F1A5 + c.charCodeAt(0))).join('');
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
    const rgs = await getReleaseGroupsMB(artistId);
    const filtered = filterReleaseGroups(rgs, title);
    allFilteredReleaseGroups = filtered;

    if (filtered.length === 0) {
      albumsContainer.innerHTML = '<p class="state-msg">No se encontraron álbumes.</p>';
      return;
    }

    const data = await processPage(filtered, 1, 6, artistName);
    renderAlbums(data.results, data.total, 1, data.totalPages);
  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando álbumes.</p>';
  }
}

// formulario

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const artist = document.getElementById('artist').value.trim();
  const title = document.getElementById('title').value.trim();

  currentTitle = title;
  currentPage = 1;
  currentArtistId = null;
  currentArtistName = artist;
  allFilteredReleaseGroups = [];

  if (!artist) {
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Introduce el nombre de un artista.</p>';
    pagination.innerHTML = '';
    return;
  }

  albumsContainer.innerHTML = '<p class="state-msg">Cargando resultados...</p>';
  pagination.innerHTML = '';

  try {
    // Siempre buscar en MusicBrainz desde el frontend
    const artists = await searchArtistMB(artist);
    if (!artists.length) {
      albumsContainer.innerHTML = '<p class="state-msg">No se encontró el artista.</p>';
      return;
    }

    if (artists.length > 1) {
      renderCandidates(artists.map(a => ({
        id: a.id,
        name: a.name,
        disambiguation: a.disambiguation || '',
        country: a.country || '',
      })), title);
      return;
    }

    await searchByArtistId(artists[0].id, artists[0].name, title);

  } catch (err) {
    console.error(err);
    albumsContainer.innerHTML = '<p class="state-msg" role="alert">Error buscando álbumes.</p>';
  }
});

//  REDIRECCIÓN

function viewAlbum(albumId) {
  window.location.href = `/albumInfo.html?id=${albumId}`;
}

function goCreateListen(albumId) {
  window.location.href = `/createListen.html?album_id=${albumId}`;
}

//INICIALIZACIÓN 

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const artistParam = params.get('artist');
  if (artistParam) {
    document.getElementById('artist').value = artistParam;
    form.dispatchEvent(new Event('submit'));
  }
});