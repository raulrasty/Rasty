const form = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const passwordConfirm = form.passwordConfirm.value;

  // Validaciones básicas
  if (password !== passwordConfirm) {
    errorMessage.textContent = "Las contraseñas no coinciden";
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.textContent = data.error || "Error al registrar usuario";
    } else {
      alert("Usuario registrado con éxito");
      window.location.href = '/index.html';
    }

  } catch (err) {
    console.error(err);
    errorMessage.textContent = "Error al conectar con el servidor";
  }
});