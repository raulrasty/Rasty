const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id");

const limit = 20;
let currentPage = 1;
let totalListens = 0;

async function fetchListens(page = 1) {
  const container = document.getElementById("listens-container");
  container.innerHTML = '<p class="state-msg">Cargando...</p>';

  try {
    const res = await fetch(`http://localhost:3000/listens/paginated/${profileUserId}?page=${page}&limit=${limit}`);
    const { listens, total } = await res.json();

    totalListens = total;
    currentPage = page;

    displayListens(listens);
    renderPagination();
    scrollToTop();

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="state-msg">Error cargando escuchas</p>';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function displayListens(listens) {
  const container = document.getElementById("listens-container");
  container.innerHTML = "";

  if (!listens.length) {
    container.innerHTML = '<p class="state-msg">No hay escuchas registradas</p>';
    return;
  }

  // Agrupar por mes y día
  const grouped = {};

  listens.forEach((l) => {
    const date = new Date(l.listen_date);
    const monthKey = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const dayKey = date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });

    if (!grouped[monthKey]) grouped[monthKey] = {};
    if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];

    grouped[monthKey][dayKey].push(l);
  });

  for (const [month, days] of Object.entries(grouped)) {
    const monthHeader = document.createElement("h2");
    monthHeader.className = "month-header";
    monthHeader.textContent = month.charAt(0).toUpperCase() + month.slice(1);
    container.appendChild(monthHeader);

    for (const [day, dayListens] of Object.entries(days)) {
      const dayHeader = document.createElement("h3");
      dayHeader.className = "day-header";
      dayHeader.textContent = day.charAt(0).toUpperCase() + day.slice(1);
      container.appendChild(dayHeader);

      const dayContainer = document.createElement("div");
      dayContainer.className = "day-container";
      container.appendChild(dayContainer);

      const sortedDayListens = [...dayListens].sort(
        (a, b) => new Date(b.listen_date) - new Date(a.listen_date)
      );

      for (const l of sortedDayListens) {
        const card = await buildListenCard(l);
        dayContainer.appendChild(card);
      }
    }
  }
}

async function buildListenCard(l) {
  const card = document.createElement("div");
  card.className = "listen-card";

  const img = document.createElement("img");
  img.className = "album-cover";
  img.src = l.album.cover_url || "https://via.placeholder.com/120";
  img.alt = l.album.title;

  const info = document.createElement("div");
  info.className = "listen-info";
  info.innerHTML = `
    <h2>${l.album.title} - ${l.album.artist}</h2>
    ${l.rating ? `<p class="rating">★ ${l.rating}</p>` : ""}
    ${l.liked ? `<p class="liked">💚 Te gusta</p>` : ""}
    ${l.review ? `<p><em>"${l.review}"</em></p>` : ""}
  `;

  const favDiv = document.createElement("div");
  favDiv.className = "listen-favorites";

  try {
    const favRes = await fetch(`http://localhost:3000/favorite-songs/listen/${l.id}`);
    const favSongs = await favRes.json();

    if (favSongs.length > 0) {
      favDiv.innerHTML = `
        <p class="favorites-label">Canciones favoritas:</p>
        <ul>
          ${favSongs.map((f) => `<li>♪ ${f.song.title}</li>`).join("")}
        </ul>
      `;
    }
  } catch (_) {}

  const btnGroup = document.createElement("div");
  btnGroup.className = "listen-actions";

  const btnAlbum = document.createElement("button");
  btnAlbum.textContent = "Ver Álbum";
  btnAlbum.className = "btn-album";
  btnAlbum.onclick = () => window.location.href = `/albumInfo.html?id=${l.album.id}`;
  btnGroup.appendChild(btnAlbum);

  if (isOwnProfile(profileUserId)) {
    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Editar";
    btnEdit.className = "btn-edit";
    btnEdit.onclick = () => window.location.href = `/editListen.html?listen_id=${l.id}`;

    const btnDelete = document.createElement("button");
    btnDelete.textContent = "Eliminar";
    btnDelete.className = "btn-delete";
    btnDelete.onclick = () => deleteListen(l.id, card);

    btnGroup.appendChild(btnEdit);
    btnGroup.appendChild(btnDelete);
  }

  card.appendChild(img);
  card.appendChild(info);
  card.appendChild(favDiv);
  card.appendChild(btnGroup);

  return card;
}

function renderPagination() {
  const totalPages = Math.ceil(totalListens / limit);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = "pagination-btn";
  prevBtn.innerHTML = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => fetchListens(currentPage - 1));

  const info = document.createElement("span");
  info.className = "pagination-info";
  info.textContent = `${currentPage} de ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.className = "pagination-btn";
  nextBtn.innerHTML = "→";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => fetchListens(currentPage + 1));

  if (currentPage > 1) pagination.appendChild(prevBtn);
  pagination.appendChild(info);
  if (currentPage < totalPages) pagination.appendChild(nextBtn);
}

async function deleteListen(listenId, cardElement) {
  if (!confirm("¿Seguro que quieres eliminar esta escucha?")) return;

  const res = await authFetch(`http://localhost:3000/listens/${listenId}`, {
    method: "DELETE",
  });

  if (res.ok) {
    cardElement.remove();
    await fetchListens(currentPage);
  } else {
    alert("Error eliminando la escucha");
  }
}

fetchListens(1);