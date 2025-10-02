// errorHandler.js - Manejo centralizado de errores
class ErrorHandler {
    static handleApiError(error, userMessage = 'Error de conexión') {
        console.error('API Error:', error);
        
        // Mostrar mensaje al usuario
        this.showError(userMessage);
        
        // En caso de error de autenticación, redirigir al login
        if (error.status === 401 || error.status === 403) {
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = 'login.html';
            }, 2000);
        }
    }

    static showError(message) {
        // Crear o usar un sistema de notificaciones existente
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d32f2f;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }

    static showSuccess(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #388e3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}