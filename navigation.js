// navigation.js - Sistema de navegación unificado
class NavigationManager {
  constructor() {
    this.initializeNavigation();
  }

  initializeNavigation() {
    // Verificar autenticación en cada página
    this.verifyAuthentication();

    // Cargar información del usuario en el header
    this.loadUserInfo();

    // Configurar event listeners
    this.setupEventListeners();
  }

  verifyAuthentication() {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (!token || !usuario) {
      window.location.href = "login.html";
      return false;
    }

    // Verificar token con el servidor
    this.verifyToken(token);
    return true;
  }

  async verifyToken(token) {
    try {
      const response = await fetch("http://localhost:3000/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Token inválido");
      }
    } catch (error) {
      console.error("Error verificando token:", error);
      this.logout();
    }
  }

  loadUserInfo() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) {
      const userNameElements = document.querySelectorAll(
        "#userName, .user-name"
      );
      userNameElements.forEach((element) => {
        element.textContent = `${usuario.nombre} ${usuario.apellido_paterno}`;
      });

      const welcomeElements = document.querySelectorAll("#welcomeMessage");
      welcomeElements.forEach((element) => {
        element.textContent = `Bienvenido, ${usuario.nombre}`;
      });
    }
  }

  setupEventListeners() {
    // Manejar logout
    const logoutButtons = document.querySelectorAll(
      '.logout-btn, [onclick*="logout"]'
    );
    logoutButtons.forEach((button) => {
      button.onclick = () => this.logout();
    });
  }

  logout() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }

  // Navegación entre páginas
  navigateTo(page) {
    window.location.href = page;
  }

  // Cargar datos comunes
  async loadCommonData() {
    // Implementar carga de datos que se usen en múltiples páginas
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.navManager = new NavigationManager();
});
