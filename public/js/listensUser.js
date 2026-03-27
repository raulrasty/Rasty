
const params = new URLSearchParams(window.location.search);

// ID del usuario cuyo perfil estamos visitando
const profileUserId = params.get('user_id');


//Función para obtener las escuchas del usuario
async function fetchListens() {
  try {
    const res = await fetch(`http://localhost:3000/listens/${profileUserId}`);
    const listens = await res.json();
    displayListens(listens);
  } catch (err) {
    console.error(err);
    document.getElementById('listens-container').innerHTML = '<p class="state-msg">Error cargando escuchas</p>';
  }
}

//Función para mostrar las escuchas
function displayListens(listens) {
  const container = document.getElementById('listens-container');
  container.innerHTML = '';

  if (!listens.length) {
    container.innerHTML = '<p class="state-msg">No hay escuchas registradas</p>';
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
      <p><strong>Fecha:</strong> ${new Date(l.listen_date).toLocaleDateString('es-ES')}</p>
      ${l.rating ? `<p class="rating">⭐ ${l.rating}/5</p>` : ''}
      ${l.liked ? `<p class="liked">💚 Te gusta</p>` : ''}
      ${l.review ? `<p><em>"${l.review}"</em></p>` : ''}
    `;

    //botón para ir a ver la info del album
    const btnAlbum = document.createElement('button');
    btnAlbum.textContent = 'Ver Álbum';
    btnAlbum.className = 'btn-album';
    btnAlbum.onclick = () => window.location.href = `/albumInfo.html?id=${l.album.id}`;
    info.appendChild(btnAlbum);


 //Botones de editar y eliminar solo si es el perfil del usuario logueado
    if (isOwnProfile(profileUserId)) {
      const btnEdit = document.createElement('button');
      btnEdit.textContent = 'Editar';
      btnEdit.onclick = () => window.location.href = `/createListen.html?listen_id=${l.id}`;

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
//función para ir a la página de editar una escucha
async function deleteListen(listenId, cardElement) {
  if (!confirm('¿Seguro que quieres eliminar esta escucha?')) return;
  const { token } = getSession();

  const res = await fetch(`http://localhost:3000/listens/${listenId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.ok) {
    cardElement.remove();
  } else {
    alert('Error eliminando la escucha');
  }
}

fetchListens();