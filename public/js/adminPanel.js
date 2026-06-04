const API_ADMIN = `${API_BASE}/admin`;

let usersPage = 1;
let albumsPage = 1;
let reviewsPage = 1;
let userSearch = '';
let albumSearch = '';
let pendingAction = null;

// ====================== INIT ======================

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar que es admin
  if (!isLoggedIn()) {
    window.location.href = '/index.html';
    return;
  }

  // Cargar stats al inicio
  loadStats();

  // Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Búsqueda usuarios
  document.getElementById('user-search-btn').addEventListener('click', () => {
    userSearch = document.getElementById('user-search').value.trim();
    usersPage = 1;
    loadUsers();
  });
  document.getElementById('user-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      userSearch = e.target.value.trim();
      usersPage = 1;
      loadUsers();
    }
  });

  // Búsqueda álbumes
  document.getElementById('album-search-btn').addEventListener('click', () => {
    albumSearch = document.getElementById('album-search').value.trim();
    albumsPage = 1;
    loadAlbums();
  });
  document.getElementById('album-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      albumSearch = e.target.value.trim();
      albumsPage = 1;
      loadAlbums();
    }
  });

  // Modal
  document.getElementById('modal-confirm').addEventListener('click', async () => {
    if (pendingAction) {
      await pendingAction();
      pendingAction = null;
    }
    closeModal();
  });
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
});

// ====================== TABS ======================

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
    t.setAttribute('aria-selected', t.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-section').forEach(s => {
    s.classList.toggle('active', s.id === `tab-${tab}`);
  });

  if (tab === 'users' && !document.getElementById('users-tbody').children.length) loadUsers();
  if (tab === 'albums' && !document.getElementById('albums-tbody').children.length) loadAlbums();
  if (tab === 'reviews' && !document.getElementById('reviews-list').children.length) loadReviews();
}

// ====================== ESTADÍSTICAS ======================

async function loadStats() {
  try {
    const res = await authFetch(`${API_ADMIN}/stats`);
    const data = await res.json();

    document.getElementById('stat-users').textContent = data.totalUsers?.toLocaleString() || '0';
    document.getElementById('stat-listens').textContent = data.totalListens?.toLocaleString() || '0';
    document.getElementById('stat-albums').textContent = data.totalAlbums?.toLocaleString() || '0';

    // Top álbumes
    const albumsList = document.getElementById('top-albums-list');
    albumsList.innerHTML = '';
    (data.topAlbums || []).forEach((a, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="list-rank">${i + 1}.</span>
        ${a.cover_url ? `<img src="${a.cover_url}" alt="${a.title}">` : ''}
        <span>${a.title} — <em>${a.artist}</em></span>
        <span class="list-count">${a.count} escuchas</span>
      `;
      albumsList.appendChild(li);
    });

    // Top usuarios
    const usersList = document.getElementById('top-users-list');
    usersList.innerHTML = '';
    (data.topUsers || []).forEach((u, i) => {
      const avatar = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || 'U')}&background=1db954&color=000&size=40`;
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="list-rank">${i + 1}.</span>
        <img src="${avatar}" alt="${u.username}">
        <span>${u.username}</span>
        <span class="list-count">${u.count} escuchas</span>
      `;
      usersList.appendChild(li);
    });

    // Gráfica semanal
    const chart = document.getElementById('weekly-chart');
    chart.innerHTML = '';
    const entries = Object.entries(data.weeklyListens || {});
    const max = Math.max(...entries.map(([, v]) => v), 1);
    entries.forEach(([day, count]) => {
      const pct = Math.max((count / max) * 100, 5);
      const wrap = document.createElement('div');
      wrap.className = 'weekly-bar-wrap';
      wrap.innerHTML = `
        <div class="weekly-bar" style="height: ${pct}%" title="${count} escuchas"></div>
        <span class="weekly-label">${day}</span>
      `;
      chart.appendChild(wrap);
    });

  } catch (err) {
    console.error('Error cargando stats:', err);
  }
}

// ====================== USUARIOS ======================

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando...</td></tr>';

  try {
    const res = await authFetch(`${API_ADMIN}/users?page=${usersPage}&limit=10&search=${encodeURIComponent(userSearch)}`);
    const data = await res.json();

    tbody.innerHTML = '';
    (data.users || []).forEach(user => {
      const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=1db954&color=000&size=40`;
      const date = user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${avatar}" alt="${user.username}" class="admin-avatar"></td>
        <td><a href="/userProfile.html?user_id=${user.id}" style="color:var(--accent)">${user.username}</a></td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${user.location || '—'}</td>
        <td>${date}</td>
        <td>
          <div class="actions-cell">
            <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="toggleRole('${user.id}', '${user.role}')">
              ${user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
            </button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="confirmDeleteUser('${user.id}', '${user.username}')">
              Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination('users-pagination', data.page, data.totalPages, (p) => {
      usersPage = p;
      loadUsers();
    });

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--red)">Error cargando usuarios</td></tr>';
  }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  try {
    await authFetch(`${API_ADMIN}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    loadUsers();
  } catch (err) {
    console.error('Error cambiando rol:', err);
  }
}

function confirmDeleteUser(userId, username) {
  document.getElementById('modal-text').textContent = `¿Eliminar al usuario "${username}"? Esta acción no se puede deshacer.`;
  pendingAction = async () => {
    await authFetch(`${API_ADMIN}/users/${userId}`, { method: 'DELETE' });
    loadUsers();
  };
  openModal();
}

// ====================== ÁLBUMES ======================

async function loadAlbums() {
  const tbody = document.getElementById('albums-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando...</td></tr>';

  try {
    const res = await authFetch(`${API_ADMIN}/albums?page=${albumsPage}&limit=10&search=${encodeURIComponent(albumSearch)}`);
    const data = await res.json();

    tbody.innerHTML = '';
    (data.albums || []).forEach(album => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${album.cover_url ? `<img src="${album.cover_url}" alt="${album.title}" class="admin-cover">` : '—'}</td>
        <td>${album.title}</td>
        <td>${album.artist}</td>
        <td>${album.release_year || '—'}</td>
        <td>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="confirmDeleteAlbum('${album.id}', '${album.title.replace(/'/g, "\\'")}')">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination('albums-pagination', data.page, data.totalPages, (p) => {
      albumsPage = p;
      loadAlbums();
    });

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--red)">Error cargando álbumes</td></tr>';
  }
}

function confirmDeleteAlbum(albumId, title) {
  document.getElementById('modal-text').textContent = `¿Eliminar el álbum "${title}"? Se eliminarán también sus canciones.`;
  pendingAction = async () => {
    await authFetch(`${API_ADMIN}/albums/${albumId}`, { method: 'DELETE' });
    loadAlbums();
  };
  openModal();
}

// ====================== RESEÑAS ======================

async function loadReviews() {
  const list = document.getElementById('reviews-list');
  list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">Cargando...</p>';

  try {
    const res = await authFetch(`${API_ADMIN}/reviews?page=${reviewsPage}&limit=10`);
    const data = await res.json();

    list.innerHTML = '';
    (data.reviews || []).forEach(review => {
      const date = review.listen_date ? new Date(review.listen_date).toLocaleDateString('es-ES') : '—';
      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-meta">
          <div class="review-header">
            <span class="review-user">${review.users?.username || '—'}</span>
            <span class="review-album">${review.albums?.title || '—'} — ${review.albums?.artist || ''}</span>
            ${review.rating ? `<span class="review-rating">★ ${review.rating}</span>` : ''}
            <span class="review-date">${date}</span>
          </div>
          <p class="review-text">"${review.review}"</p>
        </div>
        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="confirmDeleteReview('${review.id}')">
          Eliminar
        </button>
      `;
      list.appendChild(card);
    });

    if (!data.reviews?.length) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No hay reseñas</p>';
    }

    renderPagination('reviews-pagination', data.page, data.totalPages, (p) => {
      reviewsPage = p;
      loadReviews();
    });

  } catch (err) {
    list.innerHTML = '<p style="color:var(--red);text-align:center">Error cargando reseñas</p>';
  }
}

function confirmDeleteReview(reviewId) {
  document.getElementById('modal-text').textContent = '¿Eliminar esta reseña?';
  pendingAction = async () => {
    await authFetch(`${API_ADMIN}/reviews/${reviewId}`, { method: 'DELETE' });
    loadReviews();
  };
  openModal();
}

// ====================== PAGINACIÓN ======================

function renderPagination(containerId, page, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!totalPages || totalPages <= 1) return;

  if (page > 1) {
    const prev = document.createElement('button');
    prev.className = 'admin-btn admin-btn-outline admin-btn-sm';
    prev.textContent = '← Anterior';
    prev.addEventListener('click', () => onPageChange(page - 1));
    container.appendChild(prev);
  }

  const info = document.createElement('span');
  info.style.cssText = 'font-size:0.82rem;color:var(--text-muted);padding:0 8px';
  info.textContent = `${page} de ${totalPages}`;
  container.appendChild(info);

  if (page < totalPages) {
    const next = document.createElement('button');
    next.className = 'admin-btn admin-btn-outline admin-btn-sm';
    next.textContent = 'Siguiente →';
    next.addEventListener('click', () => onPageChange(page + 1));
    container.appendChild(next);
  }
}

// ====================== MODAL ======================

function openModal() {
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  pendingAction = null;
}
