document.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-password")) {
    const targetId = e.target.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      e.target.textContent = "🙈";
    } else {
      input.type = "password";
      e.target.textContent = "👁";
    }
  }
});