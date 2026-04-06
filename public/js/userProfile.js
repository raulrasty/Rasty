const API_URL = "http://localhost:3000/users";
const FOLLOWS_URL = "http://localhost:3000/follows";

const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");

// Carga principal de la página
document.addEventListener("DOMContentLoaded", async () => {

  if (!profileUserId) {
    displayError("No se especificó ningún usuario.");
    return;
  }

  try {
    // Cargar datos del usuario
    const res = await fetch(`${API_URL}/${profileUserId}`);
    if (!res.ok) throw new Error(`Usuario con ID ${profileUserId} no encontrado`);
    const user = await res.json();
    renderUser(user);

    // Cargar contadores de seguidores y seguidos
    await loadFollowStats();

    // Si es tu propio perfil mostrar botón editar
    if (isOwnProfile(profileUserId)) {
      const editBtn = document.getElementById("editProfileBtn");
      editBtn.classList.remove("hidden");
      editBtn.addEventListener("click", () => {
        window.location.href = `/editUserProfile.html?user_id=${profileUserId}`;
      });

    // Si es el perfil de otro usuario y estás logueado, mostrar botón seguir
    } else if (isLoggedIn()) {
      await loadFollowButton();
    }

  } catch (err) {
    console.error(err);
    displayError("Error cargando el usuario. Comprueba que el servidor está corriendo.");
  }
});

// Cargar contadores de seguidores y seguidos
async function loadFollowStats() {
  try {
    const [followersRes, followingRes] = await Promise.all([
      fetch(`${FOLLOWS_URL}/followers/${profileUserId}`),
      fetch(`${FOLLOWS_URL}/following/${profileUserId}`)
    ]);

    const followers = await followersRes.json();
    const following = await followingRes.json();

    document.getElementById("followers-count").textContent = followers.length;
    document.getElementById("following-count").textContent = following.length;

    // Contadores clickables
    document.getElementById("followers-count").parentElement.style.cursor = "pointer";
    document.getElementById("following-count").parentElement.style.cursor = "pointer";

    document.getElementById("followers-count").parentElement.addEventListener("click", () => {
      window.location.href = `/followers.html?user_id=${profileUserId}&type=followers`;
    });

    document.getElementById("following-count").parentElement.addEventListener("click", () => {
      window.location.href = `/followers.html?user_id=${profileUserId}&type=following`;
    });

  } catch (err) {
    console.error("Error cargando seguidores:", err);
  }
}

// Cargar botón de seguir/dejar de seguir
async function loadFollowButton() {
  try {
    const res = await authFetch(`${FOLLOWS_URL}/is-following/${profileUserId}`);
    const data = await res.json();

    const followBtn = document.getElementById("followBtn");
    followBtn.classList.remove("hidden");

    updateFollowButton(followBtn, data.following);

    followBtn.addEventListener("click", async () => {
      const isCurrentlyFollowing = followBtn.dataset.following === "true";

      if (isCurrentlyFollowing) {
        await authFetch(`${FOLLOWS_URL}/${profileUserId}`, { method: "DELETE" });
      } else {
        await authFetch(`${FOLLOWS_URL}/${profileUserId}`, { method: "POST" });
      }

      // Actualizar botón y contadores
      updateFollowButton(followBtn, !isCurrentlyFollowing);
      await loadFollowStats();
    });

  } catch (err) {
    console.error("Error cargando botón de seguir:", err);
  }
}

// Actualizar texto y estado del botón
function updateFollowButton(btn, isFollowing) {
  btn.textContent = isFollowing ? "Dejar de seguir" : "Seguir";
  btn.dataset.following = isFollowing.toString();
  btn.classList.toggle("following", isFollowing);
}

// Renderizar datos del usuario
function renderUser(user) {
  document.getElementById("username").textContent = user.username || "Sin nombre";
  document.getElementById("bio").textContent = user.bio || "Sin biografía";

  const locationEl = document.getElementById("location");
  const birthDateEl = document.getElementById("birth_date");

  if (locationEl)
    locationEl.textContent = user.location ? `Ubicación: ${user.location}` : "";

  if (birthDateEl)
    birthDateEl.textContent = user.birth_date
      ? `Nacimiento: ${new Date(user.birth_date).toLocaleDateString("es-ES")}`
      : "";

  document.getElementById("avatar").src = user.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=128`;
}

// Mostrar errores en pantalla
function displayError(message) {
  const container = document.querySelector(".profile-container");
  container.innerHTML = `<p style="color:red;text-align:center;margin-top:50px;">${message}</p>`;
}