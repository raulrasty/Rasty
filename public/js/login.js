const API_URL = "http://localhost:3000/users";

if (isLoggedIn()) {
  window.location.href = "/index.html";
}

const form = document.getElementById("login-form");
const errorEl = document.getElementById("error");
const submitBtn = form.querySelector("button[type='submit']");

function setError(message, fieldId = null) {
  errorEl.textContent = message;
  if (fieldId) {
    document.getElementById(fieldId)?.classList.add("input-error");
  }
}

function clearErrors() {
  errorEl.textContent = "";
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Entrando..." : "Entrar";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validaciones básicas antes de llamar al backend
  if (!email) {
    setError("El email es obligatorio", "email");
    return;
  }

  if (!password) {
    setError("La contraseña es obligatoria", "password");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      // Mensajes específicos según el código de error
      if (res.status === 401) {
        setError("Email o contraseña incorrectos");
      } else if (res.status === 404) {
        setError("No existe ninguna cuenta con ese email", "email");
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
      return;
    }

    saveSession(data);
    window.location.href = "/index.html";

  } catch (err) {
    setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  } finally {
    setLoading(false);
  }
});

// Limpiar error al escribir en un campo
document.getElementById("email").addEventListener("input", clearErrors);
document.getElementById("password").addEventListener("input", clearErrors);