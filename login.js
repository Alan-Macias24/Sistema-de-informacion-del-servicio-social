function login() {
  const codigo = document.getElementById("codigo").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("error");

  // Validaciones básicas
  if (!codigo || !password) {
    errorMsg.textContent = "Por favor, completa todos los campos";
    return;
  }

  if (!/^\d{10}$/.test(codigo)) {
    errorMsg.textContent = "El código UDG debe tener 10 dígitos numéricos";
    return;
  }

  // Mostrar loading
  const button = document.querySelector('button');
  const originalText = button.textContent;
  button.textContent = "Iniciando sesión...";
  button.disabled = true;

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ 
      codigo: codigo, 
      password: password 
    })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return res.json();
  })
  .then(data => {
    if (data.status === "ok") {
      // Guardar usuario en localStorage
      localStorage.setItem("usuario", JSON.stringify(data.user));
      localStorage.setItem("token", Date.now()); // Token simple para demo
      
      // Redirigir según el tipo de usuario
      redirectByUserType(data.user.tipo);
    } else {
      errorMsg.textContent = data.message;
    }
  })
  .catch(err => {
    console.error('Error:', err);
    errorMsg.textContent = "Error de conexión con el servidor. Verifica que el servidor esté ejecutándose.";
  })
  .finally(() => {
    // Restaurar botón
    button.textContent = originalText;
    button.disabled = false;
  });
}

function redirectByUserType(tipo) {
  switch(tipo) {
    case 'prestador':
      window.location.href = "dashboard_prestador.html";
      break;
    case 'receptor':
      window.location.href = "dashboard_receptor.html";
      break;
    case 'administrador':
      window.location.href = "dashboard_admin.html";
      break;
    default:
      window.location.href = "pagina_inicio.html";
  }
}

// Permitir login con Enter
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      login();
    }
  });
  
  document.getElementById('codigo').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      login();
    }
  });
});