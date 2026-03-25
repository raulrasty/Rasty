const API_URL = "http://localhost:3000/users";

document.addEventListener("DOMContentLoaded", async () => {
  const loggedInUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!loggedInUserId || !token) {
    alert("Debes iniciar sesión para editar tu perfil");
    window.location.href = "/login.html";
    return;
  }

  try {
    // Traer datos del usuario logueado
    const res = await fetch(`${API_URL}/${loggedInUserId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("No se pudo cargar tu perfil");

    const user = await res.json();
    populateForm(user);

  } catch (err) {
    console.error(err);
    document.querySelector(".edit-profile-container").innerHTML = `
      <p style="color:red; text-align:center;">Error cargando perfil</p>
    `;
  }
});

// Rellenar formulario con datos actuales
function populateForm(user) {
  document.getElementById("username").value = user.username || "";
  document.getElementById("bio").value = user.bio || "";
  document.getElementById("location").value = user.location || "";
  if (user.birth_date) {
    document.getElementById("birth_date").value =
      new Date(user.birth_date).toISOString().split("T")[0];
  }

  // Previsualizar avatar actual
  if (user.avatar_url) {
    const preview = document.getElementById("avatarPreview");
    preview.src = user.avatar_url;
    preview.style.display = "block";
  }
}

// 🔹 Previsualización del avatar al seleccionarlo
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

// 🔹 Enviar formulario
const form = document.getElementById("editProfileForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loggedInUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("bio", document.getElementById("bio").value);
  formData.append("location", document.getElementById("location").value);
  formData.append("birth_date", document.getElementById("birth_date").value);

  if (avatarInput.files[0]) {
    formData.append("avatar", avatarInput.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/${loggedInUserId}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");

    const messageEl = document.getElementById("message");
messageEl.textContent = "Perfil actualizado correctamente";
messageEl.style.color = "lightgreen";

// ✅ Redirigir al perfil después de 1 segundo
setTimeout(() => {
  const userId = localStorage.getItem("userId");
  window.location.href = `/userProfile.html?user_id=${userId}`;
}, 1000);

  } catch (err) {
    console.error(err);
    const messageEl = document.getElementById("message");
    messageEl.textContent = "Error al actualizar perfil";
    messageEl.style.color = "red";
  }
});