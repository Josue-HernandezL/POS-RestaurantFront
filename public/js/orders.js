const API_BASE_URL = 'https://pos-restaurante.onrender.com';

// Estado de la aplicación
let allItems = [];
let allCategories = [];
let currentCategory = 'all';
let orderItems = [];
let selectedTable = null;
let currentObservationIndex = null;

// Elementos del DOM
const tableSelect = document.getElementById('tableSelect');
const categoryFiltersContainer = document.querySelector('.category-filters');
const productsGrid = document.getElementById('productsGrid');
const orderItemsContainer = document.getElementById('orderItems');
const orderTotalElement = document.getElementById('orderTotal');
const orderTableElement = document.getElementById('orderTable');
const sendKitchenBtn = document.getElementById('sendKitchenBtn');
const observationBtn = document.getElementById('observationBtn');
const observationModal = document.getElementById('observationModal');
const observationOverlay = document.getElementById('observationOverlay');
const closeObservationBtn = document.getElementById('closeObservation');
const saveObservationBtn = document.getElementById('saveObservation');
const observationTextarea = document.getElementById('observationText');

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

// Cargar mesas disponibles
async function loadTables() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/mesas`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las mesas');

        const data = await response.json();
        const tables = data.datos || [];

        // Ordenar mesas por número
        tables.sort((a, b) => {
            const numA = parseInt(a.numeroMesa.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.numeroMesa.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Llenar el selector
        tableSelect.innerHTML = '<option value="">Seleccionar mesa...</option>';
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = table.numeroMesa;
            option.dataset.tableNumber = table.numeroMesa;
            tableSelect.appendChild(option);
        });

        // Si hay una mesa seleccionada previamente (desde el mapa de mesas)
        const preSelectedTableId = localStorage.getItem('selectedTableId');
        if (preSelectedTableId) {
            tableSelect.value = preSelectedTableId;
            const selectedOption = tableSelect.options[tableSelect.selectedIndex];
            selectedTable = {
                id: preSelectedTableId,
                numero: selectedOption.dataset.tableNumber
            };
            orderTableElement.textContent = `Mesa ${selectedOption.dataset.tableNumber}`;
            localStorage.removeItem('selectedTableId');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar las mesas', 'error');
    }
}

// Cargar categorías desde la API
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categorias`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las categorías');

        const data = await response.json();
        allCategories = data.datos || [];
        
        renderCategoryButtons();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar las categorías', 'error');
    }
}

// Renderizar botones de categorías
function renderCategoryButtons() {
    categoryFiltersContainer.innerHTML = '';
    
    // Botón "Todos"
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.dataset.category = 'all';
    allBtn.textContent = 'Todos';
    allBtn.addEventListener('click', () => handleCategoryClick('all', allBtn));
    categoryFiltersContainer.appendChild(allBtn);
    
    // Botones de categorías dinámicas
    allCategories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = category.id;
        btn.textContent = category.nombre;
        btn.addEventListener('click', () => handleCategoryClick(category.id, btn));
        categoryFiltersContainer.appendChild(btn);
    });
}

// Manejar click en categoría
function handleCategoryClick(categoryId, buttonElement) {
    // Remover clase active de todos los botones
    const allButtons = categoryFiltersContainer.querySelectorAll('.category-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Agregar clase active al botón clickeado
    buttonElement.classList.add('active');
    
    // Actualizar categoría actual y renderizar productos
    currentCategory = categoryId;
    renderProducts();
}

// Cargar ítems del menú
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/items`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar el menú');

        const data = await response.json();
        allItems = data.datos || [];
        
        renderProducts();
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar el menú', 'error');
    }
}

// Renderizar productos
function renderProducts() {
    const filteredItems = currentCategory === 'all' 
        ? allItems 
        : allItems.filter(item => item.categoriaId === currentCategory);

    if (filteredItems.length === 0) {
        showMessage('No hay productos disponibles en esta categoría');
        return;
    }

    productsGrid.innerHTML = '';

    filteredItems.forEach(item => {
        const card = createProductCard(item);
        productsGrid.appendChild(card);
    });
}

// Crear tarjeta de producto
function createProductCard(item) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => addToOrder(item);

    card.innerHTML = `
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ''}</p>
        <div class="product-price">$${parseFloat(item.precio).toFixed(2)}</div>
    `;

    return card;
}

// Agregar producto al pedido
function addToOrder(item) {
    if (!selectedTable) {
        showNotification('Por favor selecciona una mesa primero', 'error');
        return;
    }

    // Buscar si el item ya existe en el pedido
    const existingIndex = orderItems.findIndex(orderItem => 
        orderItem.id === item.id && orderItem.observacion === ''
    );

    if (existingIndex !== -1) {
        // Si existe, incrementar cantidad
        orderItems[existingIndex].cantidad++;
    } else {
        // Si no existe, agregarlo
        orderItems.push({
            id: item.id,
            nombre: item.nombre,
            precio: parseFloat(item.precio),
            cantidad: 1,
            observacion: ''
        });
    }

    renderOrderItems();
    updateOrderTotal();
}

// Renderizar items del pedido
function renderOrderItems() {
    if (orderItems.length === 0) {
        orderItemsContainer.innerHTML = '<div class="empty-message">No hay productos en el pedido</div>';
        sendKitchenBtn.disabled = true;
        return;
    }

    sendKitchenBtn.disabled = false;
    orderItemsContainer.innerHTML = '';

    orderItems.forEach((item, index) => {
        const itemElement = createOrderItemElement(item, index);
        orderItemsContainer.appendChild(itemElement);
    });
}

// Crear elemento de item del pedido
function createOrderItemElement(item, index) {
    const div = document.createElement('div');
    div.className = 'order-item';

    const itemTotal = item.precio * item.cantidad;

    div.innerHTML = `
        <div class="order-item-header">
            <div class="order-item-info">
                <h4>${item.nombre}</h4>
                <span class="item-price">$${item.precio.toFixed(2)}</span>
            </div>
            <button class="remove-item-btn" onclick="removeFromOrder(${index})">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
        <div class="order-item-controls">
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="decreaseQuantity(${index})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <span class="quantity-value">${item.cantidad}</span>
                <button class="quantity-btn" onclick="increaseQuantity(${index})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
            <div class="item-total">$${itemTotal.toFixed(2)}</div>
        </div>
        ${item.observacion ? `<div class="order-item-observation">Obs: ${item.observacion}</div>` : ''}
    `;

    return div;
}

// Incrementar cantidad
function increaseQuantity(index) {
    orderItems[index].cantidad++;
    renderOrderItems();
    updateOrderTotal();
}

// Decrementar cantidad
function decreaseQuantity(index) {
    if (orderItems[index].cantidad > 1) {
        orderItems[index].cantidad--;
        renderOrderItems();
        updateOrderTotal();
    }
}

// Eliminar del pedido
function removeFromOrder(index) {
    orderItems.splice(index, 1);
    renderOrderItems();
    updateOrderTotal();
}

// Actualizar total del pedido
function updateOrderTotal() {
    const total = orderItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    orderTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Abrir modal de observaciones
function openObservationModal() {
    if (orderItems.length === 0) {
        showNotification('Agrega productos al pedido primero', 'error');
        return;
    }

    observationTextarea.value = '';
    observationModal.classList.add('active');
    observationOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de observaciones
function closeObservationModal() {
    observationModal.classList.remove('active');
    observationOverlay.classList.remove('active');
    document.body.style.overflow = '';
    observationTextarea.value = '';
}

// Guardar observación general
function saveObservation() {
    const observation = observationTextarea.value.trim();
    
    if (observation) {
        // Agregar la observación al último item agregado
        if (orderItems.length > 0) {
            orderItems[orderItems.length - 1].observacion = observation;
            renderOrderItems();
            showNotification('Observación agregada');
        }
    }
    
    closeObservationModal();
}

// Enviar pedido a cocina
async function sendToKitchen() {
    if (!selectedTable) {
        showNotification('Selecciona una mesa', 'error');
        return;
    }

    if (orderItems.length === 0) {
        showNotification('Agrega productos al pedido', 'error');
        return;
    }

    // Verificar autenticación
    const token = getAuthToken();
    if (!token) {
        showNotification('No hay sesión activa. Redirigiendo al login...', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    try {
        // Deshabilitar botón mientras se procesa
        sendKitchenBtn.disabled = true;
        sendKitchenBtn.textContent = 'Enviando...';

        // Preparar datos del pedido según la API
        const pedidoData = {
            mesaId: selectedTable.id,
            items: orderItems.map(item => ({
                itemId: item.id,
                cantidad: item.cantidad,
                observaciones: item.observacion || ''
            })),
            observaciones: '' // Observaciones generales del pedido (opcional)
        };

        console.log('Enviando pedido:', pedidoData);

        // Enviar pedido a la API
        const response = await fetch(`${API_BASE_URL}/api/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pedidoData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error al crear el pedido');
        }

        // Pedido creado exitosamente
        console.log('Pedido creado:', data);
        showNotification('Pedido enviado a cocina exitosamente', 'success');
        
        // Limpiar el pedido
        orderItems = [];
        selectedTable = null;
        tableSelect.value = '';
        orderTableElement.textContent = 'Mesa -';
        renderOrderItems();
        updateOrderTotal();
        
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        // Rehabilitar botón
        sendKitchenBtn.disabled = false;
        sendKitchenBtn.textContent = 'Enviar a cocina';
    }
}

// Mostrar mensaje en el grid
function showMessage(message, type = '') {
    productsGrid.innerHTML = `<div class="empty-message ${type}">${message}</div>`;
}

// Mostrar notificación temporal
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#dc2626' : '#10b981';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
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

    // Cargar datos iniciales
    loadTables();
    loadCategories();
    loadMenuItems();

    // Selector de mesa
    tableSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (e.target.value) {
            selectedTable = {
                id: e.target.value,
                numero: selectedOption.dataset.tableNumber
            };
            orderTableElement.textContent = `Mesa ${selectedOption.dataset.tableNumber}`;
        } else {
            selectedTable = null;
            orderTableElement.textContent = 'Mesa -';
        }
    });

    // Botón de observación
    observationBtn.addEventListener('click', openObservationModal);
    
    // Cerrar modal de observación
    closeObservationBtn.addEventListener('click', closeObservationModal);
    observationOverlay.addEventListener('click', closeObservationModal);
    
    // Guardar observación
    saveObservationBtn.addEventListener('click', saveObservation);

    // Enviar a cocina
    sendKitchenBtn.addEventListener('click', sendToKitchen);
});

// Exponer funciones globalmente para los onclick en el HTML
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromOrder = removeFromOrder;

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
