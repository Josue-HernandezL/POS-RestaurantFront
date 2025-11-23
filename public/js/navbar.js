// Componente de Navbar reutilizable

// Obtener información del usuario desde localStorage
function getUserInfo() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            return JSON.parse(user);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Función para cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/views/login.html';
    }
}

// Función para obtener las iniciales del nombre
function getInitials(name) {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
}

// Crear el HTML del navbar
function createNavbar() {
    const user = getUserInfo();
    const userName = user?.nombreCompleto || 'Usuario';
    const userRole = user?.rol || 'usuario';
    const initials = getInitials(userName);
    
    // Obtener la página actual
    const currentPage = window.location.pathname.split('/').pop();
    
    return `
        <aside class="navbar">
            <div class="navbar-header">
                <h1 class="navbar-title">Sistema POS</h1>
                <p class="navbar-subtitle">Restaurante</p>
            </div>

            <nav class="navbar-menu">
                <a href="/dashboard.html" class="nav-item ${currentPage === 'dashboard.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Dashboard</span>
                </a>

                <a href="/views/orders.html" class="nav-item ${currentPage === 'orders.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 2h10v16H7V2zm-4 4h2v12H3V6z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Tomar Pedido</span>
                </a>

                <a href="/views/table-map.html" class="nav-item ${currentPage === 'table-map.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Mapa de Mesas</span>
                </a>

                <a href="/views/payments.html" class="nav-item ${currentPage === 'payments.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 4h16v3H2V4zm0 5h16v7H2V9z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Pagos</span>
                </a>

                <a href="/views/kitchen.html" class="nav-item ${currentPage === 'kitchen.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 2v5h6V2h2v16h-2v-9H7v9H5V2h2z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Cocina</span>
                </a>

                <a href="/views/menu-management.html" class="nav-item ${currentPage === 'menu-management.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 2h12v3H4V2zm0 5h12v3H4V7zm0 5h12v3H4v-3zm0 5h12v3H4v-3z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Gestión de Menú</span>
                </a>

                <a href="/views/reservations.html" class="nav-item ${currentPage === 'reservations.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 2h2v2H5V2zm8 0h2v2h-2V2zM3 6h14v12H3V6z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Reservaciones</span>
                </a>

                <a href="/views/administration.html" class="nav-item ${currentPage === 'administration.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2a3 3 0 100 6 3 3 0 000-6zM4 18v-2c0-2.21 3.58-4 8-4s8 1.79 8 4v2H4z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Administración</span>
                </a>

                <a href="/views/users-and-roles.html" class="nav-item ${currentPage === 'users-and-roles.html' ? 'active' : ''}">
                    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zm6 0a2 2 0 100-4 2 2 0 000 4zM0 17v-2c0-2.21 3.58-4 8-4s8 1.79 8 4v2H0zm16-2v2h4v-2c0-1.45-1.69-2.66-4-2.95 1.3.86 2 1.89 2 2.95z" fill="currentColor"/>
                    </svg>
                    <span class="nav-text">Usuarios y Roles</span>
                </a>
            </nav>

            <div class="navbar-footer">
                <div class="user-profile">
                    <div class="user-avatar">
                        <span class="user-initials">${initials}</span>
                    </div>
                    <div class="user-info">
                        <p class="user-name">${userName}</p>
                        <p class="user-role">${userRole}</p>
                    </div>
                </div>
                <button class="logout-button" onclick="logout()">
                    <svg class="logout-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 3H3v12h4m4-6l4-4m0 0l-4-4m4 4H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    `;
}

// Insertar el navbar en el DOM cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/views/login.html', '/views/register.html'];
    const isPublicRoute = publicRoutes.some(route => currentPath.includes(route));
    
    // Si no hay token y no es una ruta pública, redirigir al login
    if (!token && !isPublicRoute) {
        window.location.href = '/views/login.html';
        return;
    }
    
    // Si es una ruta pública, no insertar el navbar
    if (isPublicRoute) {
        return;
    }
    
    // Insertar el navbar al inicio del body
    const navbarHTML = createNavbar();
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Agregar clase al body para el layout
    document.body.classList.add('has-navbar');
});

// Hacer logout disponible globalmente
window.logout = logout;
