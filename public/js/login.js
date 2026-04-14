const API_URL = `${API_BASE}/users`
`${API_BASE}/users`
if (isLoggedIn()) {
  window.location.href = "/index.html";
}

const form = document.getElementById("login-form");
const errorEl = document.getElementById("error");
const submitBtn = form.querySelector("button[type='submit']");

function setError(message, fieldId = null) {
  errorEl.textContent = message;
  if (fieldId) {
    const input = document.getElementById(fieldId);
    input?.classList.add("input-error");
    const fieldError = document.getElementById(`${fieldId}Error`);
    if (fieldError) fieldError.textContent = message;
  }
}

function clearErrors() {
  errorEl.textContent = "";
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Entrando..." : "Entrar";
  submitBtn.setAttribute("aria-busy", loading.toString());
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

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

document.getElementById("email").addEventListener("input", clearErrors);
document.getElementById("password").addEventListener("input", clearErrors);