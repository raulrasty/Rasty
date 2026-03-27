

// Redirige si no hay sesión
if (!requireLogin()) throw new Error("No autenticado");

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const albumId = params.get("album_id");

// Elementos del DOM principales
const messageDiv = document.getElementById("message");
const form = document.getElementById("listenForm");

// Si no hay album_id en la URL, redirigir
if (!albumId) {
  alert("No se ha especificado el álbum");
  window.location.href = "/";
}

// Guardar album_id en el input oculto del formulario
document.getElementById("albumId").value = albumId;

// Establecer fecha actual por defecto
document.getElementById("listen_date").valueAsDate = new Date();


//Función para cargar la info del album
async function loadAlbumInfo() {
  try {
    const res = await fetch(`http://localhost:3000/albumInfo/${albumId}`);
    if (!res.ok) throw new Error("Álbum no encontrado");

    const album = await res.json();
    document.getElementById("album-cover").src =
      album.cover_url?.trim() || "https://via.placeholder.com/200?text=Sin+portada";
    document.getElementById("album-title").textContent = album.title || "Título no disponible";
    document.getElementById("album-artist").textContent = album.artist || "Artista no disponible";
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">No se pudo cargar la información del álbum: ${err.message}</p>`;
  }
}
loadAlbumInfo();

// Sistema de estrellas

// Seleccionar estrellas
const stars = document.querySelectorAll(".star-rating span");
// Input oculto donde se guarda el valor
const ratingInput = document.getElementById("ratingValue");

// Evento click para cada estrella
stars.forEach(star => {
  star.addEventListener("click", () => {
    const value = parseFloat(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

// Función que pinta estrellas activas
function updateStars(value) {
  stars.forEach(star => {
    star.classList.toggle("filled", parseFloat(star.dataset.value) <= value);
  });
}

// Sistema de Me gusta/Corazón 

// Icono corazón
const heart = document.getElementById("heart");
// Input oculto que guarda true/false
const likedInput = document.getElementById("likedValue");

// Alternar estado al hacer click
heart.addEventListener("click", () => {
  const liked = likedInput.value === "true";
  likedInput.value = (!liked).toString();
  heart.classList.toggle("liked", !liked);
});

//Evento de formulario para crear la escucha
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  //captar los datos del usuario
  const { token, userId } = getSession();

  // Convertir FormData a objeto
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

    // Convertir tipos correctamente
  body.rating = body.rating ? parseFloat(body.rating) : null;
  body.liked = body.liked === "true";

  // Petición POST para crear escucha
  try {
    const res = await fetch("http://localhost:3000/listens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    // Redirigir a la página de escuchas del usuario
    if (res.ok) {
      window.location.href = `/listensUser.html?user_id=${userId}`;
    } else {
      messageDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error al registrar escucha</p>`;
  }
});