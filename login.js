function login() {
  const codigo = document.getElementById("codigo").value;
  const contraseña = document.getElementById("password").value; // Cambié el nombre de la variable para coincidir con el HTML
  const errorMsg = document.getElementById("error");

  // Validaciones básicas
  if (!codigo || !contraseña) {
    errorMsg.textContent = "Por favor, completa todos los campos";
    return;
  }

  if (!/^\d{10}$/.test(codigo)) {
    errorMsg.textContent = "El código UDG debe tener 10 dígitos numéricos";
    return;
  }

  // Mostrar loading
  const button = document.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Iniciando sesión...";
  button.disabled = true;

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      codigo: codigo,
      password: contraseña, // Cambié a 'contraseña' para coincidir con la variable
    }),
  })
    .then((res) => {
      if (!res.ok) {
        // Si el servidor responde con error, intentar leer el mensaje
        return res.json().then((errorData) => {
          throw new Error(errorData.message || `Error HTTP: ${res.status}`);
        });
      }
      return res.json();
    })
    .then((data) => {
      if (data.status === "ok") {
        // Guardar usuario y token en localStorage
        localStorage.setItem("usuario", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        console.log("✅ Login exitoso, token guardado");
        console.log("👤 Usuario:", data.user);

        // Redirigir según el tipo de usuario
        redirectByUserType(data.user.tipo);
      } else {
        errorMsg.textContent = data.message || "Error desconocido en el login";
      }
    })
    .catch((err) => {
      console.error("Error completo:", err);
      errorMsg.textContent =
        err.message ||
        "Error de conexión con el servidor. Verifica que el servidor esté ejecutándose.";
    })
    .finally(() => {
      // Restaurar botón
      button.textContent = originalText;
      button.disabled = false;
    });
}

function redirectByUserType(tipo) {
  console.log("🔀 Redirigiendo según tipo:", tipo);
  switch (tipo) {
    case "prestador":
      window.location.href = "dashboard_prestador.html";
      break;
    case "receptor":
      window.location.href = "dashboard_receptor.html";
      break;
    case "administrador":
      window.location.href = "dashboard_admin.html";
      break;
    default:
      console.warn("Tipo de usuario no reconocido:", tipo);
      window.location.href = "pagina_inicio.html";
  }
}

// Permitir login con Enter
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("password")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        login();
      }
    });

  document.getElementById("codigo").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      login();
    }
  });
});
