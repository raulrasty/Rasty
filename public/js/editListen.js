// Redirige si no hay sesión
if (!requireLogin()) throw new Error("No autenticado");

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const listenId = params.get("listen_id");

// Elementos del DOM principales
const messageDiv = document.getElementById("message");
const form = document.getElementById("editListenForm");

// Si no hay listen_id en la URL, redirigir
if (!listenId) {
  alert("No se ha especificado la escucha");
  window.location.href = "/";
}

// Cargar los datos de la escucha y rellenar el formulario
async function loadListenData() {
  const { token, userId } = getSession();

  try {
    const res = await authFetch(`http://localhost:3000/listens/user/${userId}`);
    if (!res.ok) throw new Error("No se pudieron cargar las escuchas");

    const listens = await res.json();
    const listen = listens.find(l => l.id === listenId);

    if (!listen) throw new Error("Escucha no encontrada");

    // Cargar info del álbum
    document.getElementById("album-cover").src =
      listen.album.cover_url || "https://via.placeholder.com/200?text=Sin+portada";
    document.getElementById("album-title").textContent = listen.album.title || "Título no disponible";
    document.getElementById("album-artist").textContent = listen.album.artist || "Artista no disponible";

    // Rellenar formulario con los datos actuales
    if (listen.rating) {
      document.getElementById("ratingValue").value = listen.rating;
      updateStars(listen.rating);
    }

    if (listen.liked) {
      document.getElementById("likedValue").value = "true";
      document.getElementById("heart").classList.add("liked");
    }

    if (listen.review) {
      document.getElementById("review").value = listen.review;
    }

    if (listen.listen_date) {
      document.getElementById("listen_date").value =
        new Date(listen.listen_date).toISOString().split("T")[0];
    }

  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error cargando la escucha: ${err.message}</p>`;
  }
}
loadListenData();

// Sistema de estrellas
const stars = document.querySelectorAll(".star-rating span");
const ratingInput = document.getElementById("ratingValue");

stars.forEach(star => {
  star.addEventListener("click", () => {
    const value = parseFloat(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });
});

function updateStars(value) {
  stars.forEach(star => {
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

// Envío del formulario para actualizar la escucha
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { token, userId } = getSession();

  const body = {
    rating: ratingInput.value ? parseFloat(ratingInput.value) : null,
    liked: likedInput.value === "true",
    review: document.getElementById("review").value || null,
    listen_date: document.getElementById("listen_date").value || null,
  };

  try {
    const res = await authFetch(`http://localhost:3000/listens/${listenId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    if (res.ok) {
      window.location.href = `/listensUser.html?user_id=${userId}`;
    } else {
      messageDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error al actualizar la escucha</p>`;
  }
});