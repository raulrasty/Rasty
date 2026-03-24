const API_URL_ALBUM = "http://localhost:3000/albumInfo";

const params = new URLSearchParams(window.location.search);
const albumId = params.get("album_id");
const messageDiv = document.getElementById("message");
const form = document.getElementById("listenForm");

if (!albumId) {
  alert("No se ha especificado el álbum");
  window.location.href = "/";
}

// Prellenar formulario
document.getElementById("albumId").value = albumId;
document.getElementById("listen_date").valueAsDate = new Date();

// 📥 Cargar info del álbum
async function loadAlbumInfo() {
  try {
    const res = await fetch(`${API_URL_ALBUM}/${albumId}`);
    if (!res.ok) throw new Error("Álbum no encontrado");

    const album = await res.json();

    document.getElementById("album-cover").src =
      album.cover_url?.trim() ||
      "https://via.placeholder.com/200?text=Sin+portada";
    document.getElementById("album-title").textContent =
      album.title || "Título no disponible";
    document.getElementById("album-artist").textContent =
      album.artist || "Artista no disponible";
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">No se pudo cargar la información del álbum: ${err.message}</p>`;
  }
}
loadAlbumInfo();

// ⭐ Sistema de estrellas
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
    const starValue = parseFloat(star.dataset.value);
    star.classList.toggle("filled", starValue <= value);
  });
}

// ❤️ Corazón toggle
const heart = document.getElementById("heart");
const likedInput = document.getElementById("likedValue");

heart.addEventListener("click", () => {
  const liked = likedInput.value === "true";
  likedInput.value = (!liked).toString();
  heart.classList.toggle("liked", !liked);
});

// 📝 Enviar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  body.rating = body.rating ? parseFloat(body.rating) : null;
  body.liked = body.liked === "true";

  if (!body.album_id) {
    alert("Falta album_id");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const loggedInUserId = localStorage.getItem("userId");

    const res = await fetch("http://localhost:3000/listens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({ error: "Error desconocido" }));

    if (res.ok) {
      window.location.href = `/listensUser.html?user_id=${loggedInUserId}`;
    } else {
      messageDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    messageDiv.innerHTML = `<p class="error">Error al registrar escucha</p>`;
  }
});
