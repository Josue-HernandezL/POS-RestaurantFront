const API_BASE_URL = 'https://pos-restaurante.onrender.com';

let allTables = [];
let currentFilter = 'all';
let selectedTableId = null;

// Elementos del DOM
const tablesGrid = document.getElementById('tablesGrid');
const tableModal = document.getElementById('tableModal');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModal');
const filterButtons = document.querySelectorAll('.filter-btn');

// Elementos del modal
const modalTableName = document.getElementById('modalTableName');
const modalCapacity = document.getElementById('modalCapacity');
const modalSection = document.getElementById('modalSection');
const takeOrderBtn = document.getElementById('takeOrderBtn');
const processPaymentBtn = document.getElementById('processPaymentBtn');
const statusButtons = document.querySelectorAll('.status-btn');

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem('token');
}

// Headers de autenticación
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// Verificar autenticación
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}



// Cargar todas las mesas
async function loadTables(estado = null) {
    try {
        let url = `${API_BASE_URL}/api/mesas`;
        if (estado && estado !== 'all') {
            url += `?estado=${estado}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Error al cargar las mesas');
        }

        const data = await response.json();
        console.log(data)
        // La API devuelve un objeto con la estructura {exito, datos, total}
        allTables = Array.isArray(data) ? data : (data.datos || data.mesas || data.data || []);
        
        // Ordenar mesas por número
        allTables.sort((a, b) => {
            const numA = parseInt(a.numeroMesa.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.numeroMesa.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
        
        renderTables(allTables);
        updateCounters();
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar las mesas', 'error');
    }
}

// Renderizar mesas en el grid
function renderTables(tables) {
    if (!Array.isArray(tables) || tables.length === 0) {
        showMessage('No hay mesas disponibles');
        return;
    }

    tablesGrid.innerHTML = '';

    tables.forEach(table => {
        const tableCard = createTableCard(table);
        tablesGrid.appendChild(tableCard);
    });
}

// Crear tarjeta de mesa
function createTableCard(table) {
    const card = document.createElement('div');
    card.className = `table-card ${table.estado}`;
    card.dataset.tableId = table.id;
    card.onclick = () => openTableModal(table.id);

    const estadoLabels = {
        'libre': 'Libre',
        'ocupada': 'Ocupada',
        'reservada': 'Reservada',
        'en_limpieza': 'En Limpieza'
    };

    card.innerHTML = `
        <div class="table-info">
            <div class="table-number">${table.numeroMesa}</div>
            <div class="table-capacity">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                ${table.capacidad} personas
            </div>
            <div class="table-section">${table.seccion || 'Sin sección'}</div>
        </div>
        <div class="table-status">${estadoLabels[table.estado] || table.estado}</div>
    `;

    return card;
}

// Abrir modal con detalles de la mesa
async function openTableModal(tableId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mesas/${tableId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al cargar los detalles de la mesa');
        }

        const data = await response.json();
        // Asegurar que tenemos el objeto mesa correcto - la API devuelve {exito, datos}
        const table = data.datos || data.mesa || data;
        selectedTableId = table.id;

        // Actualizar contenido del modal
        modalTableName.textContent = `${table.numeroMesa}`;
        console.log(table.numeroMesa);
        modalCapacity.textContent = `${table.capacidad} personas`;
        console.log(table.capacidad);
        modalSection.textContent = table.seccion || 'Sin sección';
        console.log(table.seccion);

        // Marcar el botón de estado actual
        statusButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === table.estado);
        });

        // Mostrar modal
        tableModal.classList.add('active');
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la mesa');
    }
}

// Cerrar modal
function closeModal() {
    tableModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    selectedTableId = null;
}

// Cambiar estado de la mesa
async function changeTableStatus(tableId, newEstado) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mesas/${tableId}/estado`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ estado: newEstado })
        });

        if (!response.ok) {
            throw new Error('Error al cambiar el estado de la mesa');
        }

        const data = await response.json();
        // La API devuelve {exito, datos} donde datos es el objeto mesa actualizado
        const updatedTable = data.datos || data.mesa || data;
        
        // Actualizar el estado local
        const tableIndex = allTables.findIndex(t => t.id === tableId);
        if (tableIndex !== -1) {
            allTables[tableIndex] = updatedTable;
        }

        // Actualizar la vista
        renderTables(filterTables(allTables, currentFilter));
        updateCounters();

        // Actualizar botones del modal
        statusButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === newEstado);
        });

        // Mostrar notificación
        showNotification('Estado actualizado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar el estado de la mesa');
    }
}

// Filtrar mesas por estado
function filterTables(tables, filter) {
    if (filter === 'all') {
        return tables;
    }
    return tables.filter(table => table.estado === filter);
}

// Actualizar contadores de filtros
function updateCounters() {
    const counters = {
        all: allTables.length,
        libre: allTables.filter(t => t.estado === 'libre').length,
        ocupada: allTables.filter(t => t.estado === 'ocupada').length,
        reservada: allTables.filter(t => t.estado === 'reservada').length,
        en_limpieza: allTables.filter(t => t.estado === 'en_limpieza').length
    };

    Object.keys(counters).forEach(key => {
        const countElement = document.getElementById(`count-${key}`);
        if (countElement) {
            countElement.textContent = `(${counters[key]})`;
        }
    });
}

// Mostrar mensaje en el grid
function showMessage(message, type = '') {
    tablesGrid.innerHTML = `<div class="message ${type}">${message}</div>`;
}

// Mostrar notificación temporal
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
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

    // Cargar mesas iniciales
    loadTables();

    // Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar botón activo
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Actualizar filtro actual
            currentFilter = btn.dataset.filter;

            // Filtrar y renderizar
            const filteredTables = filterTables(allTables, currentFilter);
            renderTables(filteredTables);
        });
    });

    // Cerrar modal
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Cambiar estado desde el modal
    statusButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedTableId) {
                const newStatus = btn.dataset.status;
                changeTableStatus(selectedTableId, newStatus);
            }
        });
    });

    // Botón Tomar Pedido
    takeOrderBtn.addEventListener('click', () => {
        if (selectedTableId) {
            localStorage.setItem('selectedTableId', selectedTableId);
            window.location.href = 'orders.html';
        }
    });

    // Botón Procesar Pago
    processPaymentBtn.addEventListener('click', () => {
        if (selectedTableId) {
            localStorage.setItem('selectedTableId', selectedTableId);
            window.location.href = 'payments.html';
        }
    });
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
