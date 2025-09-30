function login() {
  const codigo = document.getElementById("codigo").value;
  const contraseña = document.getElementById("contraseña").value;
  const errorMsg = document.getElementById("error");

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "ok") {
      localStorage.setItem("usuario", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      errorMsg.textContent = data.message;
    }
  })
  .catch(err => {
    errorMsg.textContent = "Error de conexión con el servidor";
  });
}
