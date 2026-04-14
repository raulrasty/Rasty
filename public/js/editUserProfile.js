const API_URL = "http://localhost:3000/users";
const messageEl = document.getElementById("message");
const submitBtn = document.querySelector(".btn-submit");

function showError(msg) {
  messageEl.textContent = msg;
  messageEl.className = "message msg-error";
  messageEl.setAttribute("role", "alert");
}

function showSuccess(msg) {
  messageEl.textContent = msg;
  messageEl.className = "message msg-success";
  messageEl.setAttribute("role", "status");
}

function clearMessage() {
  messageEl.textContent = "";
  messageEl.className = "message";
  messageEl.removeAttribute("role");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Guardando..." : "Guardar cambios";
  submitBtn.setAttribute("aria-busy", loading.toString());
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireLogin()) return;

  const { userId } = getSession();

  try {
    const res = await authFetch(`${API_URL}/${userId}`);
    if (!res.ok) throw new Error("No se pudo cargar tu perfil");

    const user = await res.json();
    populateForm(user);
  } catch (err) {
    console.error(err);
    showError("Error cargando el perfil. Inténtalo de nuevo.");
  }

  // Botón eliminar cuenta
  const deleteBtn = document.getElementById("delete-account-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteAccount);
  }
});

function populateForm(user) {
  document.getElementById("username").value = user.username || "";
  document.getElementById("bio").value = user.bio || "";
  document.getElementById("location").value = user.location || "";
  if (user.birth_date) {
    document.getElementById("birth_date").value = new Date(user.birth_date)
      .toISOString()
      .split("T")[0];
  }

  if (user.avatar_url) {
    const preview = document.getElementById("avatarPreview");
    preview.src = user.avatar_url;
    preview.alt = `Avatar actual de ${user.username}`;
    preview.classList.remove("hidden");
  }
}

// Previsualización del avatar
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");

avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showError("La imagen no puede superar 2MB");
    avatarInput.value = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    showError("El archivo debe ser una imagen");
    avatarInput.value = "";
    return;
  }

  clearMessage();
  const reader = new FileReader();
  reader.onload = () => {
    avatarPreview.src = reader.result;
    avatarPreview.alt = "Vista previa del nuevo avatar";
    avatarPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// Envío del formulario
document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const { userId } = getSession();

  const bio = document.getElementById("bio").value.trim();
  const location = document.getElementById("location").value.trim();
  const birth_date = document.getElementById("birth_date").value;

  if (bio.length > 300) {
    showError("La biografía no puede superar 300 caracteres");
    return;
  }

  if (location.length > 100) {
    showError("La ubicación no puede superar 100 caracteres");
    return;
  }

  setLoading(true);

  const formData = new FormData();
  formData.append("bio", bio);
  formData.append("location", location);
  formData.append("birth_date", birth_date);
  if (avatarInput.files[0]) formData.append("avatar", avatarInput.files[0]);

  try {
    const res = await authFetch(`${API_URL}/${userId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Error al actualizar el perfil");
      return;
    }

    showSuccess("¡Perfil actualizado correctamente!");
    setTimeout(() => {
      window.location.href = `/userProfile.html?user_id=${userId}`;
    }, 1000);

  } catch (err) {
    console.error(err);
    showError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  } finally {
    setLoading(false);
  }
});

// Eliminar cuenta propia
async function deleteAccount() {
  const confirmed = confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos.");
  if (!confirmed) return;

  const deleteBtn = document.getElementById("delete-account-btn");
  deleteBtn.disabled = true;
  deleteBtn.textContent = "Eliminando...";
  deleteBtn.setAttribute("aria-busy", "true");

  try {
    const res = await authFetch(`${API_URL}/me`, { method: "DELETE" });

    if (res.ok) {
      showSuccess("Cuenta eliminada correctamente. Redirigiendo...");
      setTimeout(() => {
        logout();
        window.location.href = "/login.html";
      }, 1500);
    } else {
      const data = await res.json();
      showError(data.error || "Error al eliminar la cuenta");
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Eliminar cuenta";
      deleteBtn.setAttribute("aria-busy", "false");
    }
  } catch (err) {
    console.error(err);
    showError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Eliminar cuenta";
    deleteBtn.setAttribute("aria-busy", "false");
  }
}