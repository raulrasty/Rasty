const API_URL = "http://localhost:3000/users";

const form = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  resultsContainer.innerHTML = '<p class="state-msg">Buscando...</p>';

  try {
    const res = await fetch(`${API_URL}/search?username=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Error en la búsqueda");

    const users = await res.json();

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

function renderResults(users) {
  resultsContainer.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("a");
    card.className = "user-card";
    card.href = `/userProfile.html?user_id=${user.id}`;
    card.setAttribute("aria-label", `Ver perfil de ${user.username}`);

    const avatarSrc = user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || "U")}&background=1db954&color=000&size=52`;

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