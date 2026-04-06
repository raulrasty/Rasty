const FOLLOWS_URL = "http://localhost:3000/follows";
const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");
const type = params.get("type"); // "followers" o "following"

// Cargar la lista según el tipo
document.addEventListener("DOMContentLoaded", async () => {
  if (!profileUserId || !type) {
    window.location.href = "/";
    return;
  }

  document.getElementById("page-title").textContent =
    type === "followers" ? "Seguidores" : "Siguiendo";

  try {
    const res = await fetch(`${FOLLOWS_URL}/${type}/${profileUserId}`);
    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error(err);
    document.getElementById("users-list").innerHTML =
      '<p class="state-msg">Error cargando usuarios</p>';
  }
});

// Renderizar lista de usuarios
function renderUsers(users) {
  const container = document.getElementById("users-list");

  if (!users.length) {
    container.innerHTML = '<p class="state-msg">No hay usuarios aquí todavía</p>';
    return;
  }

  users.forEach(user => {
    const card = document.createElement("a");
    card.className = "user-card";
    card.href = `/userProfile.html?user_id=${user.id}`;

    const avatarSrc = user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=52`;

    card.innerHTML = `
      <img src="${avatarSrc}" alt="${user.username}">
      <span>${user.username}</span>
    `;

    container.appendChild(card);
  });
}