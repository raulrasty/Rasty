const API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", async () => {
  // Obtener datos de sesión
  if (!requireLogin()) return;

  const { token, userId } = getSession();

  try {
    // Petición al backend para obtener los datos del usuario
    const res = await authFetch(`${API_URL}/${userId}`);
    if (!res.ok) throw new Error("No se pudo cargar tu perfil");

    const user = await res.json();
    // Rellenar formulario con los datos recibidos
    populateForm(user);
  } catch (err) {
    console.error(err);
    document.querySelector(".edit-profile-container").innerHTML =
      `<p style="color:red;text-align:center;">Error cargando perfil</p>`;
  }
});

// Funcion para rellenar formulario con los datos recibidos
function populateForm(user) {
  document.getElementById("username").value = user.username || "";
  document.getElementById("bio").value = user.bio || "";
  document.getElementById("location").value = user.location || "";
  if (user.birth_date) {
    document.getElementById("birth_date").value = new Date(user.birth_date)
      .toISOString()
      .split("T")[0];
  }

  // Mostrar avatar actual si existe
  if (user.avatar_url) {
    const preview = document.getElementById("avatarPreview");
    preview.src = user.avatar_url;
    preview.style.display = "block";
  }
}
//previsualización del nuevo avatar
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");

avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    avatarPreview.src = reader.result;
    avatarPreview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// Envío del formulario para actualizar el perfil
document
  .getElementById("editProfileForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const { token, userId } = getSession();

    // Usamos FormData para poder enviar archivo para el avatar
    const formData = new FormData();
    formData.append("bio", document.getElementById("bio").value);
    formData.append("location", document.getElementById("location").value);
    formData.append("birth_date", document.getElementById("birth_date").value);
    if (avatarInput.files[0]) formData.append("avatar", avatarInput.files[0]);

    try {
      // Petición PUT para actualizar usuario
      const res = await authFetch(`${API_URL}/${userId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");

      const messageEl = document.getElementById("message");
      messageEl.textContent = "Perfil actualizado correctamente";
      messageEl.style.color = "var(--accent)";

      setTimeout(() => {
        window.location.href = `/userProfile.html?user_id=${userId}`;
      }, 1000);
    } catch (err) {
      console.error(err);
      const messageEl = document.getElementById("message");
      messageEl.textContent = "Error al actualizar perfil";
      messageEl.style.color = "var(--red)";
    }
  });
