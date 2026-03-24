const API_URL = "http://localhost:3000/users";

const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (token && userId) {
  window.location.href = "index.html";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").textContent = data.error;
      return;
    }

    // ✅ Guardar token correctamente
   localStorage.setItem("token", data.session.access_token);
localStorage.setItem("userId", data.user.id);
localStorage.setItem("userEmail", data.user.email);

    // Redirigir
    window.location.href = "index.html";

  } catch (err) {
    document.getElementById("error").textContent = "Error al conectar con el servidor";
  }
});