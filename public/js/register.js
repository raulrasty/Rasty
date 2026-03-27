const form = document.getElementById("registerForm");
const errorMessage = document.getElementById("errorMessage");

//envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  //obtener los datos
  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const passwordConfirm = form.passwordConfirm.value;

  //validaciones
  if (username.length < 3) {
    errorMessage.textContent =
      "El nombre de usuario debe tener al menos 3 caracteres";
    return;
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (password !== passwordConfirm) {
    errorMessage.textContent = "Las contraseñas no coinciden";
    return;
  }

  if (!passwordRegex.test(password)) {
    errorMessage.textContent =
      "La contraseña debe tener mínimo 6 caracteres, al menos una mayúscula, una minúscula y un número";
    return;
  }


  //petición al back para hacer el registro
  try {
    const res = await fetch("http://localhost:3000/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMessage.textContent = data.error || "Error al registrar usuario";
    } else {
      alert("Usuario registrado con éxito");
      window.location.href = "/index.html";
    }
  } catch (err) {
    console.error(err);
    errorMessage.textContent = "Error al conectar con el servidor";
  }
});
