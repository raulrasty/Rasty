// Supongamos que el profileUserId viene de la URL:
// /profile.html?user_id=5
const params = new URLSearchParams(window.location.search);
const profileUserId = params.get('user_id');

// loggedInUserId lo obtenemos del token decoded o del backend
const loggedInUserId = localStorage.getItem('user_id'); // ejemplo simple

async function fetchListens() {
  try {
    const res = await fetch(`http://localhost:3000/listens/${profileUserId}`);
    const listens = await res.json();
    displayListens(listens);
  } catch (err) {
    console.error(err);
    document.getElementById('listens-container').innerHTML = "<p>Error cargando escuchas</p>";
  }
}

function displayListens(listens) {
  const container = document.getElementById('listens-container');
  container.innerHTML = '';

  if (!listens.length) {
    container.innerHTML = '<p>No hay escuchas registradas</p>';
    return;
  }

  listens.forEach(l => {
    const card = document.createElement('div');
    card.className = 'listen-card';

    const img = document.createElement('img');
    img.className = 'album-cover';
    img.src = l.album.cover_url || 'https://via.placeholder.com/120';
    img.alt = l.album.title;

    const info = document.createElement('div');
    info.className = 'listen-info';
    info.innerHTML = `
      <h2>${l.album.title} - ${l.album.artist}</h2>
      <p><strong>Fecha:</strong> ${new Date(l.listen_date).toLocaleDateString()}</p>
      ${l.rating ? `<p class="rating">⭐ ${l.rating}/5</p>` : ''}
      ${l.liked ? `<p class="liked">💚 Te gusta</p>` : ''}
      ${l.review ? `<p><em>"${l.review}"</em></p>` : ''}
    `;

    // 🔹 Botón "Ver Álbum"
    const btnAlbum = document.createElement('button');
    btnAlbum.textContent = 'Ver Álbum';
    btnAlbum.className = 'btn-album';
    btnAlbum.onclick = () => {
      window.location.href = `/albumInfo.html?id=${l.album.id}`;
    };
    info.appendChild(btnAlbum);

    // Botones de editar y eliminar (solo si es tu perfil)
    if (profileUserId == loggedInUserId) {
      const btnEdit = document.createElement('button');
      btnEdit.textContent = 'Editar';
      btnEdit.onclick = () => editListen(l.id);

      const btnDelete = document.createElement('button');
      btnDelete.textContent = 'Eliminar';
      btnDelete.onclick = () => deleteListen(l.id, card);

      info.appendChild(btnEdit);
      info.appendChild(btnDelete);
    }

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

// Funciones de ejemplo para editar/eliminar
function editListen(listenId) {
  alert(`Editar escucha ${listenId}`);
}

async function deleteListen(listenId, cardElement) {
  if (!confirm('¿Seguro que quieres eliminar esta escucha?')) return;

  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:3000/listens/${listenId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.ok) {
    cardElement.remove();
  } else {
    alert('Error eliminando la escucha');
  }
}

// Cargar escuchas al inicio
fetchListens();