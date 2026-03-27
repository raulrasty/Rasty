
const API_URL = "http://localhost:3000/users";

// Si ya hay sesión, redirigir al inicio
if (isLoggedIn()) {
  window.location.href = "/index.html";
}

//evento principal de login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  //obtener los datos del formulario
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  //petición al back para hacer el login
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").textContent = data.error;
      return;
    }

    //Guardar los datos
    saveSession(data); 

    // Redirigir
    window.location.href = "/index.html";

  } catch (err) {
    document.getElementById("error").textContent = "Error al conectar con el servidor";
  }
});