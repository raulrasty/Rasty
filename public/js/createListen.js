const API_URL_ALBUM = "http://localhost:3000/albumInfo";

const params = new URLSearchParams(window.location.search);
const albumId = params.get('album_id');

if (!albumId) {
  alert('No se ha especificado el álbum');
  window.location.href = '/';
}

document.getElementById('albumId').value = albumId;
document.getElementById('listen_date').valueAsDate = new Date();
const messageDiv = document.getElementById('message');

// Cargar info del álbum
async function loadAlbumInfo() {
  try {
    const resAlbum = await fetch(`${API_URL_ALBUM}/${albumId}`);
    const album = await resAlbum.json();

    if (!resAlbum.ok) throw new Error(album.error || "Álbum no encontrado");

    document.getElementById('album-cover').src = album.cover_url?.trim() || 'https://via.placeholder.com/200?text=Sin+portada';
    document.getElementById('album-title').textContent = album.title || 'Título no disponible';
    document.getElementById('album-artist').textContent = album.artist || 'Artista no disponible';
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">No se pudo cargar la información del álbum: ${err.message}</p>`;
  }
}

loadAlbumInfo();

// ⭐ Medias estrellas
const stars = document.querySelectorAll('.star-rating span');
const ratingInput = document.getElementById('ratingValue');

stars.forEach(star => {
  star.addEventListener('click', () => {
    const value = parseFloat(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

function updateStars(value) {
  stars.forEach(star => {
    const starValue = parseFloat(star.dataset.value);
    if (starValue <= value) {
      star.classList.add('filled');
    } else {
      star.classList.remove('filled');
    }
  });
}

// ❤️ Corazón toggle
const heart = document.getElementById('heart');
const likedInput = document.getElementById('likedValue');

heart.addEventListener('click', () => {
  const liked = likedInput.value === 'true';
  likedInput.value = !liked;
  heart.classList.toggle('liked', !liked);
});

// Enviar formulario
const form = document.getElementById('listenForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  // ⚠️ Ajuste para UUID
  // No usar parseInt, dejar album_id como string
  body.album_id = body.album_id;
  body.rating = body.rating ? parseFloat(body.rating) : null;
  body.liked = body.liked === 'true';

  if (!body.album_id) {
    alert("Falta album_id");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/listens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

   if (res.ok) {
  // ⚡ Aquí redirigimos al perfil del usuario
  const loggedInUserId = localStorage.getItem('userId'); 
  window.location.href = `/listensUser.html?user_id=${loggedInUserId}`;
} else {
  messageDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
}
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error al registrar escucha</p>`;
  }
});