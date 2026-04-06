// Redirige si no hay sesión
if (!requireLogin()) throw new Error("No autenticado");

const params = new URLSearchParams(window.location.search);
const albumId = params.get("album_id");
const messageDiv = document.getElementById("message");
const form = document.getElementById("listenForm");

if (!albumId) {
  alert("No se ha especificado el álbum");
  window.location.href = "/";
}

document.getElementById("albumId").value = albumId;
document.getElementById("listen_date").valueAsDate = new Date();

// Canciones favoritas seleccionadas
let selectedSongIds = [];

// Cargar info del álbum y canciones
async function loadAlbumInfo() {
  try {
    const res = await fetch(`http://localhost:3000/albumInfo/${albumId}`);
    if (!res.ok) throw new Error("Álbum no encontrado");

    const album = await res.json();
    document.getElementById("album-cover").src =
      album.cover_url?.trim() || "https://via.placeholder.com/200?text=Sin+portada";
    document.getElementById("album-title").textContent = album.title || "Título no disponible";
    document.getElementById("album-artist").textContent = album.artist || "Artista no disponible";

    // Cargar canciones para seleccionar favoritas
    await loadSongsForSelection();

  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">No se pudo cargar la información del álbum: ${err.message}</p>`;
  }
}

// Cargar lista de canciones para seleccionar favoritas
async function loadSongsForSelection() {
  try {
    const res = await fetch(`http://localhost:3000/songs/${albumId}`);
    const data = await res.json();
    const songs = data.songs || [];

    console.log("Canciones cargadas:", songs);

    const list = document.getElementById("favorite-songs-list");
    list.innerHTML = "";

    songs.forEach(song => {
      const li = document.createElement("li");
      li.className = "favorite-song-item";
      li.dataset.songId = song.id;
      li.textContent = `${song.position}. ${song.title}`;

      li.addEventListener("click", () => toggleFavoriteSong(song.id, li));
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Error cargando canciones:", err);
  }
}

// Seleccionar/deseleccionar canción favorita
function toggleFavoriteSong(songId, element) {
  if (selectedSongIds.includes(songId)) {
    selectedSongIds = selectedSongIds.filter(id => id !== songId);
    element.classList.remove("selected");
  } else {
    if (selectedSongIds.length >= 3) {
      messageDiv.innerHTML = `<p class="error">Solo puedes elegir 3 canciones favoritas</p>`;
      return;
    }
    selectedSongIds.push(songId);
    element.classList.add("selected");
    messageDiv.innerHTML = "";
  }
}

loadAlbumInfo();

// Sistema de estrellas
const stars = document.querySelectorAll(".star-rating span");
const ratingInput = document.getElementById("ratingValue");

stars.forEach((star) => {
  star.addEventListener("click", () => {
    const value = parseFloat(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

function updateStars(value) {
  stars.forEach((star) => {
    star.classList.toggle("filled", parseFloat(star.dataset.value) <= value);
  });
}

// Sistema de corazón
const heart = document.getElementById("heart");
const likedInput = document.getElementById("likedValue");

heart.addEventListener("click", () => {
  const liked = likedInput.value === "true";
  likedInput.value = (!liked).toString();
  heart.classList.toggle("liked", !liked);
});

// Envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { userId } = getSession();
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  body.rating = body.rating ? parseFloat(body.rating) : null;
  body.liked = body.liked === "true";

  try {
    // Crear el listen
    const res = await authFetch("http://localhost:3000/listens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    if (!res.ok) {
      messageDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
      return;
    }

    // Si hay canciones favoritas seleccionadas, guardarlas
    if (selectedSongIds.length > 0) {
      await authFetch(`http://localhost:3000/favorite-songs/listen/${data.listen.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: selectedSongIds }),
      });
    }

    window.location.href = `/listensUser.html?user_id=${userId}`;

  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error al registrar escucha</p>`;
  }
});