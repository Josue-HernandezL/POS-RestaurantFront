// kitchen.js - L\u00f3gica de la pantalla de cocina (KDS)

const API_BASE_URL = 'https://pos-restaurante.onrender.com';

// Estado de la aplicaci\u00f3n
let allOrders = [];
let currentFilter = 'all';
let updateInterval = null;

// Elementos del DOM
const ordersGrid = document.getElementById('ordersGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Obtener token de autenticaci\u00f3n
function getAuthToken() {
    return localStorage.getItem('token');
}

// Headers de autenticaci\u00f3n
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// Verificar autenticaci\u00f3n
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Cargar pedidos de cocina
async function loadKitchenOrders() {
    try {
        const url = currentFilter === 'all' 
            ? `${API_BASE_URL}/api/cocina/pedidos`
            : `${API_BASE_URL}/api/cocina/pedidos?estado=${currentFilter}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }

        const data = await response.json();
        allOrders = data.datos?.pedidos || [];
        
        renderOrders();
        updateOrderCounts(data.datos?.totales);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar los pedidos', 'error');
    }
}

// Renderizar pedidos
function renderOrders() {
    if (allOrders.length === 0) {
        showEmptyState();
        return;
    }

    ordersGrid.innerHTML = '';
    
    allOrders.forEach(order => {
        const card = createOrderCard(order);
        ordersGrid.appendChild(card);
    });
    
    // Actualizar timers cada minuto
    updateAllTimers();
}

// Crear tarjeta de pedido
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = `order-card ${order.estado}`;
    card.dataset.orderId = order.id;
    
    // Calcular tiempo transcurrido solo si está en preparación
    let timerHTML = '';
    if (order.estado === 'en_preparacion') {
        const createdTime = new Date(order.creadoEn);
        const elapsed = Math.floor((Date.now() - createdTime.getTime()) / 1000 / 60);
        const timerClass = elapsed > 10 ? 'warning' : '';
        
        timerHTML = `
            <div class="order-timer ${timerClass}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span data-created="${order.creadoEn}" data-state="${order.estado}">${formatElapsedTime(elapsed)}</span>
            </div>
        `;
    } else if (order.estado === 'listo') {
        // Mostrar tiempo final (desde creación hasta que se marcó como listo)
        const createdTime = new Date(order.creadoEn);
        const updatedTime = new Date(order.actualizadoEn);
        const totalTime = Math.floor((updatedTime.getTime() - createdTime.getTime()) / 1000 / 60);
        
        timerHTML = `
            <div class="order-timer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${formatElapsedTime(totalTime)}</span>
            </div>
        `;
    } else {
        // Estado pendiente: mostrar 0:00
        timerHTML = `
            <div class="order-timer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>0:00</span>
            </div>
        `;
    }
    
    // Generar HTML de items
    const itemsHTML = order.items.map(item => `
        <div class="order-item">
            <span class="quantity">${item.cantidad}x</span>
            <span class="item-name">${item.nombre}</span>
        </div>
        ${item.observaciones ? `<div class="order-observations">Obs: ${item.observaciones}</div>` : ''}
    `).join('');
    
    // Bot\u00f3n seg\u00fan estado
    let actionButton = '';
    if (order.estado === 'pendiente') {
        actionButton = `
            <button class="order-action" onclick="startPreparation('${order.id}')">
                Comenzar
            </button>
        `;
    } else if (order.estado === 'en_preparacion') {
        actionButton = `
            <button class="order-action ready" onclick="markAsReady('${order.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Marcar Listo
            </button>
        `;
    }
    
    card.innerHTML = `
        <div class="order-card-header">
            <div class="order-info">
                <h3>${order.numeroMesa}</h3>
                <p>Pedido # ${order.id.substring(0, 6)}</p>
            </div>
            ${timerHTML}
        </div>
        
        <div class="order-items">
            ${itemsHTML}
        </div>
        
        ${order.observaciones ? `<div class="order-observations">${order.observaciones}</div>` : ''}
        
        ${actionButton}
    `;
    
    return card;
}

// Iniciar preparaci\u00f3n de pedido
async function startPreparation(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${orderId}/iniciar`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.mensaje || 'Error al iniciar preparaci\u00f3n');
        }

        showNotification('Pedido en preparaci\u00f3n');
        await loadKitchenOrders();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Marcar pedido como listo
async function markAsReady(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cocina/pedidos/${orderId}/listo`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.mensaje || 'Error al marcar como listo');
        }

        showNotification('Pedido listo para servir', 'success');
        await loadKitchenOrders();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Formatear tiempo transcurrido
function formatElapsedTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `0:${mins.toString().padStart(2, '0')}`;
}

// Actualizar todos los timers
function updateAllTimers() {
    const timers = document.querySelectorAll('.order-timer span[data-created]');
    
    timers.forEach(timer => {
        // Solo actualizar timers de pedidos en preparación
        const state = timer.dataset.state;
        if (state !== 'en_preparacion') return;
        
        const createdTime = new Date(timer.dataset.created);
        const elapsed = Math.floor((Date.now() - createdTime.getTime()) / 1000 / 60);
        timer.textContent = formatElapsedTime(elapsed);
        
        // Agregar clase warning si ha pasado más de 10 minutos
        const timerContainer = timer.closest('.order-timer');
        if (elapsed > 10) {
            timerContainer.classList.add('warning');
        } else {
            timerContainer.classList.remove('warning');
        }
    });
}

// Actualizar contadores de pedidos
function updateOrderCounts(totales) {
    if (!totales) return;
    
    document.getElementById('countAll').textContent = `(${totales.total || 0})`;
    document.getElementById('countPendiente').textContent = `(${totales.pendientes || 0})`;
    document.getElementById('countPreparando').textContent = `(${totales.en_preparacion || 0})`;
    document.getElementById('countListo').textContent = `(${totales.listos || 0})`;
}

// Mostrar estado vac\u00edo
function showEmptyState() {
    ordersGrid.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                <line x1="6" y1="17" x2="18" y2="17"></line>
            </svg>
            <h3>No hay pedidos ${currentFilter === 'all' ? '' : 'en este estado'}</h3>
            <p>Los pedidos aparecer\u00e1n aqu\u00ed autom\u00e1ticamente</p>
        </div>
    `;
}

// Manejar cambio de filtro
function handleFilterChange(filter) {
    currentFilter = filter;
    
    // Actualizar botones activos
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    loadKitchenOrders();
}

// Mostrar notificaci\u00f3n
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    // Cargar pedidos iniciales
    loadKitchenOrders();

    // Configurar filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            handleFilterChange(btn.dataset.filter);
        });
    });

    // Actualizar pedidos cada 30 segundos
    updateInterval = setInterval(() => {
        loadKitchenOrders();
    }, 30000);
    
    // Actualizar timers cada minuto
    setInterval(updateAllTimers, 60000);
});

// Limpiar intervalo al cerrar la p\u00e1gina
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// Exponer funciones globalmente para los onclick
window.startPreparation = startPreparation;
window.markAsReady = markAsReady;
