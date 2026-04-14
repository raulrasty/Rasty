const form = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");
const submitBtn = document.getElementById("submitBtn");

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);
  if (input) input.classList.add("input-error");
  if (errorEl) errorEl.textContent = message;
}

function clearErrors() {
  errorMessage.textContent = "";
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Registrando..." : "Registrarse";
  submitBtn.setAttribute("aria-busy", loading.toString());
}

["username", "email", "password", "passwordConfirm"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", clearErrors);
});

document.getElementById("acceptPrivacy")?.addEventListener("change", clearErrors);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const passwordConfirm = form.passwordConfirm.value;
  const acceptPrivacy = document.getElementById("acceptPrivacy").checked;

  let hasErrors = false;

  if (!username) {
    setFieldError("username", "El nombre de usuario es obligatorio");
    hasErrors = true;
  } else if (username.length < 3) {
    setFieldError("username", "El nombre de usuario debe tener al menos 3 caracteres");
    hasErrors = true;
  } else if (username.length > 20) {
    setFieldError("username", "El nombre de usuario no puede superar 20 caracteres");
    hasErrors = true;
  }

  if (!email) {
    setFieldError("email", "El correo electrónico es obligatorio");
    hasErrors = true;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!password) {
    setFieldError("password", "La contraseña es obligatoria");
    hasErrors = true;
  } else if (!passwordRegex.test(password)) {
    setFieldError("password", "Mínimo 6 caracteres, una mayúscula, una minúscula y un número");
    hasErrors = true;
  }

  if (!passwordConfirm) {
    setFieldError("passwordConfirm", "Confirma tu contraseña");
    hasErrors = true;
  } else if (password !== passwordConfirm) {
    setFieldError("passwordConfirm", "Las contraseñas no coinciden");
    hasErrors = true;
  }

  if (!acceptPrivacy) {
    setFieldError("acceptPrivacy", "Debes aceptar la política de privacidad");
    hasErrors = true;
  }

  if (hasErrors) return;

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        if (data.error?.toLowerCase().includes("email")) {
          setFieldError("email", "Ya existe una cuenta con ese correo");
        } else if (data.error?.toLowerCase().includes("username")) {
          setFieldError("username", "Ese nombre de usuario ya está en uso");
        } else {
          errorMessage.textContent = data.error || "Error al registrar usuario";
        }
      } else {
        errorMessage.textContent = data.error || "Error al registrar usuario";
      }
    } else {
      window.location.href = "/login.html";
    }
  } catch (err) {
    console.error(err);
    errorMessage.textContent = "No se pudo conectar con el servidor. Inténtalo de nuevo.";
  } finally {
    setLoading(false);
  }
});