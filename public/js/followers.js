// CONFIGURACIÓN Y CAPTURA DE PARÁMETROS DE LA URL
const FOLLOWS_URL = `${API_BASE}/follows`;
const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");
const type = params.get("type");


//INICIALIZACIÓN Y CARGA DE DATOS AL CARGAR EL DOM
document.addEventListener("DOMContentLoaded", async () => {
  if (!profileUserId || !type) {
    window.location.href = "/";
    return;
  }
  // Configuración dinámica de títulos de la página
  const pageTitle = type === "followers" ? "Seguidores" : "Siguiendo";
  document.getElementById("page-title").textContent = pageTitle;
  document.title = `${pageTitle} - Rasty`;

  // Petición al servidor para obtener la lista de usuarios
  try {
    const res = await fetch(`${FOLLOWS_URL}/${type}/${profileUserId}`);
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error(err);
    document.getElementById("users-list").innerHTML =
      '<p class="state-msg" role="alert">Error cargando usuarios</p>';
  }
});

// RENDERIZADO DE LA LISTA DE USUARIOS
function renderUsers(users) {
  const container = document.getElementById("users-list");

  if (!users.length) {
    container.innerHTML = '<p class="state-msg">No hay usuarios aquí todavía</p>';
    return;
  }

  // Creación dinámica de cada tarjeta de usuario
  users.forEach(user => {
    const card = document.createElement("a");
    card.className = "user-card";
    card.href = `/userProfile.html?user_id=${user.id}`;
    card.setAttribute("aria-label", `Ver perfil de ${user.username}`);

    // Avatar (o placeholder por defecto)
    const avatarSrc = user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=52`;

    card.innerHTML = `
      <img src="${avatarSrc}" alt="${user.username}">
      <span>${user.username}</span>
    `;

    container.appendChild(card);
  });
}