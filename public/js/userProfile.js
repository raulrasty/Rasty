const API_URL = "http://localhost:3000/users";

const params = new URLSearchParams(window.location.search);
const profileUserId = params.get("user_id"); // viene de ?user_id=...

// Asegúrate de que coincide con lo que guardas al hacer login
const loggedInUserId = localStorage.getItem("userId"); // ejemplo: "userId"

document.addEventListener("DOMContentLoaded", async () => {
  if (!profileUserId) {
    displayError("No se especificó ningún usuario.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${profileUserId}`);
    if (!res.ok)
      throw new Error(`Usuario con ID ${profileUserId} no encontrado`);

    const user = await res.json();
    renderUser(user);

    console.log("loggedInUserId:", loggedInUserId);
    console.log("profileUserId:", profileUserId);

    // Mostrar botón editar solo si es tu perfil
    if (loggedInUserId && loggedInUserId.toString() === profileUserId.toString()) {
      const editBtn = document.getElementById("editProfileBtn");
      editBtn.classList.remove("hidden");

      // Redirigir a la página de editar perfil
      editBtn.addEventListener("click", () => {
        window.location.href = `/editUserProfile.html?user_id=${profileUserId}`;
      });
    }

  } catch (err) {
    console.error(err);
    displayError(
      "Error cargando el usuario. Comprueba que el servidor está corriendo.",
    );
  }
});

function renderUser(user) {
  document.getElementById("username").textContent =
    user.username || "Sin nombre";
  document.getElementById("bio").textContent = user.bio || "Sin biografía";

  const locationEl = document.getElementById("location");
  const birthDateEl = document.getElementById("birth_date");

  if (locationEl)
    locationEl.textContent = user.location ? `Ubicación: ${user.location}` : "";
  if (birthDateEl)
    birthDateEl.textContent = user.birth_date
      ? `Nacimiento: ${new Date(user.birth_date).toLocaleDateString("es-ES")}`
      : "";

  document.getElementById("avatar").src = user.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username || "U") + "&background=random&size=128";
}

function displayError(message) {
  const container = document.querySelector(".profile-container");
  container.innerHTML = `<p style="color: red; text-align: center; margin-top: 50px;">${message}</p>`;
}