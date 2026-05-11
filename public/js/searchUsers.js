// CONFIGURACIÓN Y REFERENCIAS DEL DOM
const API_URL = `${API_BASE}/users`;


const form = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");


//GESTIÓN DEL EVENTO DE BÚSQUEDA
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  // Estado de carga inicial
  resultsContainer.innerHTML = '<p class="state-msg">Buscando...</p>';

  try {
    // Petición al servidor para buscar por nombre de usuario
    const res = await fetch(`${API_URL}/search?username=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error en la búsqueda");

    const users = await res.json();
    // Validación de resultados vacíos
    if (!users || users.length === 0) {
      resultsContainer.innerHTML = `<p class="state-msg">No encontramos a nadie con ese nombre. ¿Quizás buscabas algo diferente?</p>`;
      return;
    }

    renderResults(users);

  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = '<p class="state-msg" role="alert">Error al buscar usuarios.</p>';
  }
});


//GENERACIÓN DE TARJETAS DE USUARIO
function renderResults(users) {
  resultsContainer.innerHTML = "";

  users.forEach((user) => {
    // Creación del contenedor de la tarjeta (Enlace al perfil)
    const card = document.createElement("a");
    card.className = "user-card";
    card.href = `/userProfile.html?user_id=${user.id}`;
    card.setAttribute("aria-label", `Ver perfil de ${user.username}`);

    // Configuración de imagen (Avatar real o placeholder dinámico)
    const avatarSrc = user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=52`;

    // Inyección del contenido de la tarjeta
    card.innerHTML = `
      <img src="${avatarSrc}" alt="${user.username}"
        onerror="this.src='https://ui-avatars.com/api/?name=U&background=333&color=fff&size=52'">
      <div class="user-info">
        <span class="user-username">${user.username}</span>
        ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
        ${user.location ? `<p class="user-location">📍 ${user.location}</p>` : ''}
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}