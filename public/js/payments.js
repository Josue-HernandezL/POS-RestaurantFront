const API_URL = 'https://pos-restaurante.onrender.com/api';
const CONFIG_CACHE_KEY = 'posRestaurantConfig';
const DEFAULT_TIP_OPTIONS = [0, 10, 15, 20];

let systemConfig = null;
let configuredTipOptions = [...DEFAULT_TIP_OPTIONS];
let ivaPercentage = 16;

// Estado global
let selectedTableId = null;
let selectedTableNumber = null;
let currentAccount = null;
let selectedPaymentMethod = 'efectivo';
let selectedTipPercentage = 10;
let customTipAmount = 0;
let isSplitMode = false;
let splitData = null;
let peopleCount = 2;

// Elementos del DOM
const tableSelect = document.getElementById('tableSelect');
const ordersSection = document.getElementById('ordersSection');
const splitSection = document.getElementById('splitSection');
const splitToggleContainer = document.getElementById('splitToggleContainer');
const toggleSplitBtn = document.getElementById('toggleSplitBtn');
const cancelSplitBtn = document.getElementById('cancelSplitBtn');
const decreasePeople = document.getElementById('decreasePeople');
const increasePeople = document.getElementById('increasePeople');
const peopleCountInput = document.getElementById('peopleCount');
const splitItemsContainer = document.getElementById('splitItems');
const applySplitBtn = document.getElementById('applySplitBtn');
const paymentButtons = document.querySelectorAll('.payment-btn');
const tipButtons = document.querySelectorAll('.tip-btn');
const customTipInput = document.getElementById('customTip');
const subtotalElement = document.getElementById('subtotal');
const taxElement = document.getElementById('tax');
const tipAmountElement = document.getElementById('tipAmount');
const totalAmountElement = document.getElementById('totalAmount');
const processPaymentBtn = document.getElementById('processPaymentBtn');

function getCachedConfiguration() {
    try {
        const raw = localStorage.getItem(CONFIG_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.datos || parsed?.data || null;
    } catch (error) {
        console.warn('No se pudo leer la configuración cacheada', error);
        return null;
    }
}

function cacheSystemConfiguration(config) {
    try {
        localStorage.setItem(
            CONFIG_CACHE_KEY,
            JSON.stringify({
                datos: config,
                actualizadoEn: Date.now()
            })
        );
    } catch (error) {
        console.warn('No se pudo guardar la configuración', error);
    }
}

function buildTipOptionsFromConfig(config) {
    const options = [0];
    const propinas = config?.propinas;

    if (propinas) {
        ['opcion1', 'opcion2', 'opcion3'].forEach((key) => {
            const value = parseFloat(propinas[key]);
            if (!Number.isNaN(value) && value > 0) {
                options.push(value);
            }
        });
    }

    if (options.length === 1) {
        return [...DEFAULT_TIP_OPTIONS];
    }

    while (options.length < DEFAULT_TIP_OPTIONS.length) {
        options.push(options[options.length - 1]);
    }

    return options.slice(0, DEFAULT_TIP_OPTIONS.length);
}

function updateTaxLabel() {
    const label = document.getElementById('taxLabel');
    if (label) {
        label.textContent = `IVA (${ivaPercentage}%):`;
    }
}

function setActiveTipButton(value) {
    tipButtons.forEach((btn) => {
        const btnValue = parseFloat(btn.dataset.tip) || 0;
        const shouldBeActive = value !== null && btnValue === value;
        btn.classList.toggle('active', shouldBeActive);
    });
}

function configureTipButtons() {
    const tipValues = configuredTipOptions;

    tipButtons.forEach((btn, index) => {
        const value = tipValues[index] ?? 0;
        btn.dataset.tip = value;
        const label = btn.querySelector('.tip-label');
        if (label) {
            label.textContent = `${value}%`;
        } else {
            btn.textContent = `${value}%`;
        }
    });

    if (!customTipAmount) {
        const defaultTip = tipValues.find((value, idx) => idx > 0 && value > 0) ?? 0;
        selectedTipPercentage = defaultTip;
        setActiveTipButton(defaultTip);
    }
}

function applyConfigurationToPayments(config) {
    if (!config) {
        updateTaxLabel();
        return;
    }

    const newIva = parseFloat(config?.impuestos?.porcentajeIVA);
    ivaPercentage = !Number.isNaN(newIva) ? newIva : 16;
    configuredTipOptions = buildTipOptionsFromConfig(config);

    updateTaxLabel();
    configureTipButtons();
    calculateSplitTip();
    updateSummary();
}

async function loadSystemConfiguration() {
    try {
        const response = await fetch(`${API_URL}/configuracion`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener la configuración del restaurante');
        }

        const data = await response.json();
        systemConfig = data.datos;
        cacheSystemConfiguration(systemConfig);
        applyConfigurationToPayments(systemConfig);
    } catch (error) {
        console.warn('Error al cargar configuración del sistema:', error);
        if (!systemConfig) {
            const cached = getCachedConfiguration();
            if (cached) {
                systemConfig = cached;
                applyConfigurationToPayments(systemConfig);
            }
        }
    }
}

function handleStorageConfiguration(event) {
    if (event.key !== CONFIG_CACHE_KEY || !event.newValue) return;

    try {
        const parsed = JSON.parse(event.newValue);
        const config = parsed?.datos || parsed?.data;
        if (config) {
            systemConfig = config;
            applyConfigurationToPayments(systemConfig);
        }
    } catch (error) {
        console.warn('Error al sincronizar configuración desde storage:', error);
    }
}

function initializeConfigurationSync() {
    const cached = getCachedConfiguration();
    if (cached) {
        systemConfig = cached;
    }
    applyConfigurationToPayments(systemConfig);
    loadSystemConfiguration();
    window.addEventListener('storage', handleStorageConfiguration);
}

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

// Mostrar notificación
function showNotification(message, type = 'info') {
    alert(message); // Simplificado por ahora
}

// Cargar mesas disponibles
async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/mesas`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las mesas');

        const data = await response.json();
        const tables = data.datos || [];

        // Filtrar mesas con pedidos activos
        const tablesWithOrders = tables.filter(table => 
            table.estado === 'ocupada' || table.estado === 'atendiendo'
        );

        // Ordenar por número de mesa
        tablesWithOrders.sort((a, b) => {
            const numA = parseInt(a.numeroMesa.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.numeroMesa.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Llenar el selector
        tableSelect.innerHTML = '<option value="">Seleccionar mesa...</option>';
        tablesWithOrders.forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = table.numeroMesa;
            option.dataset.tableNumber = table.numeroMesa;
            tableSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar las mesas', 'error');
    }
}

// Cargar cuenta de la mesa
async function loadTableAccount(tableId) {
    try {
        const response = await fetch(`${API_URL}/pagos/mesas/${tableId}/cuenta`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                showEmptyOrders();
                return;
            }
            throw new Error('Error al cargar la cuenta');
        }

        const data = await response.json();
        currentAccount = data.datos;
        
        displayOrders(currentAccount.pedidos);
        updateSummary();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar la cuenta de la mesa', 'error');
        showEmptyOrders();
    }
}

// Mostrar mensaje de sin órdenes
function showEmptyOrders() {
    ordersSection.innerHTML = '<p class="empty-message">No hay órdenes pendientes para esta mesa</p>';
    currentAccount = null;
    hideSplitToggle();
    updateSummary();
}

// Mostrar órdenes
function displayOrders(orders) {
    if (!orders || orders.length === 0) {
        showEmptyOrders();
        return;
    }

    let ordersHTML = '<div class="orders-list">';
    
    orders.forEach(order => {
        order.items.forEach(item => {
            ordersHTML += `
                <div class="order-item">
                    <div class="order-info">
                        <p class="order-name">${item.nombre}</p>
                        <p class="order-details">Cantidad: ${item.cantidad} × $${item.precioUnitario.toFixed(2)}</p>
                        ${item.observaciones ? `<p class="order-details">${item.observaciones}</p>` : ''}
                    </div>
                    <div class="order-price">$${item.subtotal.toFixed(2)}</div>
                </div>
            `;
        });
    });
    
    ordersHTML += '</div>';
    ordersSection.innerHTML = ordersHTML;
    
    // Mostrar botón de dividir cuenta si no está en modo división
    if (!isSplitMode) {
        showSplitToggle();
    }
}

// Actualizar resumen de pago
function updateSummary() {
    if (!currentAccount) {
        subtotalElement.textContent = '0.00';
        taxElement.textContent = '0.00';
        tipAmountElement.textContent = '0.00';
        totalAmountElement.textContent = '0.00';
        processPaymentBtn.disabled = true;
        return;
    }

    // Si está en modo división, usar esa función
    if (isSplitMode && splitData) {
        updateSummaryWithSplit();
        return;
    }

    const subtotal = currentAccount.resumen.subtotal;
    const tax = currentAccount.resumen.impuestos;
    
    // Calcular propina
    let tipAmount = 0;
    if (customTipAmount > 0) {
        tipAmount = customTipAmount;
    } else if (selectedTipPercentage > 0) {
        tipAmount = (subtotal * selectedTipPercentage) / 100;
    }

    const total = subtotal + tax + tipAmount;

    // Actualizar elementos
    subtotalElement.textContent = subtotal.toFixed(2);
    taxElement.textContent = tax.toFixed(2);
    tipAmountElement.textContent = tipAmount.toFixed(2);
    totalAmountElement.textContent = total.toFixed(2);
    
    processPaymentBtn.disabled = false;
}

// Procesar pago
async function processPayment() {
    if (!currentAccount || !selectedTableId) {
        showNotification('Debe seleccionar una mesa con órdenes', 'error');
        return;
    }

    // Confirmar pago
    const total = document.getElementById('totalAmount').textContent;
    const confirmMessage = `¿Confirmar pago de $${total} para ${selectedTableNumber}?`;
    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        processPaymentBtn.disabled = true;
        processPaymentBtn.innerHTML = '<span>Procesando...</span>';

        const paymentData = {
            mesaId: selectedTableId,
            metodoPago: selectedPaymentMethod
        };

        // Agregar propina
        if (customTipAmount > 0) {
            paymentData.propina = customTipAmount;
            paymentData.propinaPersonalizada = true;
        } else if (selectedTipPercentage > 0) {
            paymentData.porcentajePropina = selectedTipPercentage;
        }

        // Agregar datos de división si existe
        if (isSplitMode && splitData) {
            paymentData.cuentaDividida = true;
            paymentData.numeroDivisiones = splitData.numeroDivisiones;
            paymentData.divisiones = splitData.divisiones;
        }

        const response = await fetch(`${API_URL}/pagos/procesar`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.mensaje || 'Error al procesar el pago');
        }

        const data = await response.json();
        
        showNotification('Pago procesado exitosamente', 'success');
        
        // Reiniciar formulario
        resetForm();
        
        // Recargar mesas
        await loadTables();

    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
        processPaymentBtn.disabled = false;
        processPaymentBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 7L8 14L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Procesar Pago</span>
        `;
    }
}

// Reiniciar formulario
function resetForm() {
    selectedTableId = null;
    selectedTableNumber = null;
    currentAccount = null;
    isSplitMode = false;
    splitData = null;
    peopleCount = 2;
    
    tableSelect.value = '';
    showEmptyOrders();
    splitSection.style.display = 'none';
    splitToggleContainer.style.display = 'none';
    updateSummary();
    
    // Resetear método de pago
    paymentButtons.forEach(btn => btn.classList.remove('active'));
    paymentButtons[0].classList.add('active');
    selectedPaymentMethod = 'efectivo';
    
    // Resetear propina
    tipButtons.forEach(btn => btn.classList.remove('active'));
    tipButtons[1].classList.add('active'); // 10% por defecto
    selectedTipPercentage = 10;
    customTipInput.value = '';
    customTipAmount = 0;
}

// Mostrar botón de dividir cuenta
function showSplitToggle() {
    if (splitToggleContainer) {
        splitToggleContainer.style.display = 'block';
    }
}

// Ocultar botón de dividir cuenta
function hideSplitToggle() {
    if (splitToggleContainer) {
        splitToggleContainer.style.display = 'none';
    }
}

// Mostrar sección de división
function showSplitSection() {
    ordersSection.style.display = 'none';
    splitSection.style.display = 'block';
    splitToggleContainer.style.display = 'none';
    renderSplitItems();
}

// Ocultar sección de división
function hideSplitSection() {
    ordersSection.style.display = 'block';
    splitSection.style.display = 'none';
    
    // Solo mostrar botón de dividir si hay pedidos y no está en modo división
    if (currentAccount && currentAccount.pedidos && currentAccount.pedidos.length > 0 && !isSplitMode) {
        splitToggleContainer.style.display = 'block';
    }
    
    // Si no está en modo división, limpiar datos temporales
    if (!isSplitMode) {
        splitData = null;
        peopleCount = 2;
        peopleCountInput.value = 2;
        splitItemsContainer.innerHTML = '';
        updateSummary();
    }
}

// Renderizar items para división
function renderSplitItems() {
    if (!currentAccount || !currentAccount.pedidos) return;
    
    const people = parseInt(peopleCountInput.value) || 2;
    let html = '';
    
    // Recopilar todos los items únicos
    const allItems = [];
    currentAccount.pedidos.forEach(order => {
        order.items.forEach((item, idx) => {
            const uniqueId = item.itemId || `${order.id}-item-${idx}`;
            allItems.push({
                uniqueId: uniqueId,
                pedidoId: order.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: item.subtotal
            });
        });
    });
    
    for (let i = 0; i < people; i++) {
        html += `
            <div class="split-person" data-person="${i}">
                <div class="split-person-header">
                    <h3 class="person-title">Persona ${i + 1}</h3>
                    <span class="person-total">$<span class="person-total-value" data-person="${i}">0.00</span></span>
                </div>
                <div class="person-items" data-person="${i}">
        `;
        
        allItems.forEach(item => {
            html += `
                <label class="split-item-checkbox">
                    <input type="checkbox" 
                           data-person="${i}" 
                           data-item-id="${item.uniqueId}"
                           data-pedido-id="${item.pedidoId}"
                           data-subtotal="${item.subtotal}"
                           class="item-checkbox"
                           data-unique-key="${item.pedidoId}-${item.uniqueId}"
                           onchange="handleItemCheck(this)">
                    <div class="split-item-info">
                        <p class="split-item-name">${item.nombre}</p>
                        <p class="split-item-details">${item.cantidad}x $${item.precioUnitario.toFixed(2)}</p>
                    </div>
                    <span class="split-item-price">$${item.subtotal.toFixed(2)}</span>
                </label>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    splitItemsContainer.innerHTML = html;
    updateSplitTotals();
}

// Manejar selección de items (evitar duplicados)
window.handleItemCheck = function(checkbox) {
    if (checkbox.checked) {
        const uniqueKey = checkbox.dataset.uniqueKey;
        
        // Desmarcar este item en otras personas
        document.querySelectorAll(`input[data-unique-key="${uniqueKey}"]`).forEach(cb => {
            if (cb !== checkbox && cb.checked) {
                cb.checked = false;
            }
        });
    }
    
    updateSplitTotals();
};

// Actualizar totales de división
window.updateSplitTotals = function() {
    const people = parseInt(peopleCountInput.value) || 2;
    
    for (let i = 0; i < people; i++) {
        const checkboxes = document.querySelectorAll(`input[data-person="${i}"]:checked`);
        let total = 0;
        
        checkboxes.forEach(checkbox => {
            const subtotal = parseFloat(checkbox.dataset.subtotal || checkbox.dataset.price || 0);
            if (!isNaN(subtotal)) {
                total += subtotal;
            }
        });
        
        const totalElement = document.querySelector(`.person-total-value[data-person="${i}"]`);
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }
};

// Aplicar división de cuenta
async function applySplit() {
    const people = parseInt(peopleCountInput.value) || 2;
    const divisions = [];
    const assignedItems = new Set();
    
    // Recopilar items por persona
    for (let i = 0; i < people; i++) {
        const checkboxes = document.querySelectorAll(`input[data-person="${i}"]:checked`);
        const items = [];
        
        checkboxes.forEach(checkbox => {
            const itemKey = `${checkbox.dataset.pedidoId}-${checkbox.dataset.itemId}`;
            
            // Verificar si el item ya fue asignado a otra persona
            if (assignedItems.has(itemKey)) {
                console.warn(`Item ${itemKey} ya fue asignado a otra persona`);
                return;
            }
            
            assignedItems.add(itemKey);
            const subtotal = parseFloat(checkbox.dataset.subtotal || checkbox.dataset.price || 0);
            items.push({
                itemId: checkbox.dataset.itemId,
                pedidoId: checkbox.dataset.pedidoId,
                subtotal: subtotal
            });
        });
        
        if (items.length > 0) {
            divisions.push({ items });
        }
    }
    
    // Validar que haya al menos una división
    if (divisions.length === 0) {
        showNotification('Debe asignar al menos un item a una persona', 'error');
        return;
    }
    
    // Contar items únicos disponibles
    const uniqueItems = new Set();
    splitItemsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        uniqueItems.add(`${cb.dataset.pedidoId}-${cb.dataset.itemId}`);
    });
    const totalCheckboxes = uniqueItems.size;
    const checkedBoxes = assignedItems.size;
    
    if (checkedBoxes < totalCheckboxes) {
        const unassignedCount = totalCheckboxes - checkedBoxes;
        if (!confirm(`Hay ${unassignedCount} item(s) sin asignar. ¿Desea continuar de todos modos?`)) {
            return;
        }
    }
    
    console.log('Divisiones a enviar:', divisions);
    
    try {
        applySplitBtn.disabled = true;
        applySplitBtn.textContent = 'Calculando...';
        
        // Llamar a la API para dividir la cuenta
        const response = await fetch(`${API_URL}/pagos/dividir-cuenta`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                mesaId: selectedTableId,
                numeroDivisiones: divisions.length,
                divisiones: divisions
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.mensaje || 'Error al dividir la cuenta');
        }
        
        const data = await response.json();
        splitData = data.datos;
        isSplitMode = true;
        
        // Ocultar sección de división y mostrar resumen
        hideSplitSection();
        displayOrders(currentAccount.pedidos);
        updateSummaryWithSplit();
        
        showNotification('Cuenta dividida exitosamente', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    } finally {
        applySplitBtn.disabled = false;
        applySplitBtn.textContent = 'Aplicar División';
    }
}

// Actualizar resumen con división
function updateSummaryWithSplit() {
    if (!splitData) {
        updateSummary();
        return;
    }
    
    const summaryContent = document.querySelector('.summary-content');
    
    // Crear resumen de división
    let html = '<div class="split-summary">';
    html += '<div class="split-summary-header">Cuenta Dividida</div>';
    
    splitData.divisiones.forEach((division, index) => {
        html += `
            <div class="split-person-summary">
                <div class="split-person-summary-header">Persona ${division.numero}</div>
                <div class="split-person-row">
                    <span>Subtotal:</span>
                    <span class="value">$${division.subtotal.toFixed(2)}</span>
                </div>
                <div class="split-person-row">
                    <span>IVA:</span>
                    <span class="value">$${division.impuestos.toFixed(2)}</span>
                </div>
                <div class="split-person-row">
                    <span>Total:</span>
                    <span class="value">$${division.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Totales generales
    html += `
        <div class="summary-row">
            <span class="label">Subtotal Total:</span>
            <span class="value">$${splitData.totales.subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="label">IVA Total (${ivaPercentage}%):</span>
            <span class="value">$${splitData.totales.impuestos.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="label">Propina:</span>
            <span class="value">$<span id="tipAmount">0.00</span></span>
        </div>
        <div class="summary-total">
            <span class="label">Gran Total:</span>
            <span class="value">$<span id="totalAmount">${splitData.totales.total.toFixed(2)}</span></span>
        </div>
    `;
    
    summaryContent.innerHTML = html;
    
    // Calcular propina sobre el total
    calculateSplitTip();
}

// Calcular propina en cuenta dividida
function calculateSplitTip() {
    if (!splitData) return;
    
    const subtotal = splitData.totales.subtotal;
    let tipAmount = 0;
    
    if (customTipAmount > 0) {
        tipAmount = customTipAmount;
    } else if (selectedTipPercentage > 0) {
        tipAmount = (subtotal * selectedTipPercentage) / 100;
    }
    
    const total = splitData.totales.total + tipAmount;
    
    const tipElement = document.getElementById('tipAmount');
    const totalElement = document.getElementById('totalAmount');
    
    if (tipElement) tipElement.textContent = tipAmount.toFixed(2);
    if (totalElement) totalElement.textContent = total.toFixed(2);
    
    processPaymentBtn.disabled = false;
}

// Event Listeners

// Selección de mesa
tableSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    selectedTableId = e.target.value;
    selectedTableNumber = selectedOption.dataset.tableNumber;
    
    // Limpiar completamente el estado de división al cambiar de mesa
    isSplitMode = false;
    splitData = null;
    peopleCount = 2;
    peopleCountInput.value = 2;
    splitSection.style.display = 'none';
    splitToggleContainer.style.display = 'none';
    splitItemsContainer.innerHTML = '';
    
    if (selectedTableId) {
        loadTableAccount(selectedTableId);
    } else {
        showEmptyOrders();
    }
});

// Botones de método de pago
paymentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        paymentButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPaymentMethod = btn.dataset.method;
    });
});

// Botones de propina
tipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tipValue = parseFloat(btn.dataset.tip) || 0;
        setActiveTipButton(tipValue);
        selectedTipPercentage = tipValue;
        customTipInput.value = '';
        customTipAmount = 0;
        updateSummary();
    });
});

// Propina personalizada
customTipInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 0;
    customTipAmount = value;
    
    if (value > 0) {
        setActiveTipButton(null);
        selectedTipPercentage = 0;
    } else if (!Array.from(tipButtons).some(btn => btn.classList.contains('active'))) {
        setActiveTipButton(selectedTipPercentage);
    }
    
    updateSummary();
});

// Botón para dividir cuenta
toggleSplitBtn.addEventListener('click', () => {
    showSplitSection();
});

// Botón para cancelar división
cancelSplitBtn.addEventListener('click', () => {
    hideSplitSection();
});

// Aumentar número de personas
increasePeople.addEventListener('click', () => {
    if (peopleCount < 20) {
        peopleCount++;
        peopleCountInput.value = peopleCount;
        renderSplitItems();
    }
});

// Disminuir número de personas
decreasePeople.addEventListener('click', () => {
    if (peopleCount > 2) {
        peopleCount--;
        peopleCountInput.value = peopleCount;
        renderSplitItems();
    }
});

// Input manual de número de personas
peopleCountInput.addEventListener('change', (e) => {
    let value = parseInt(e.target.value);
    if (value < 2) value = 2;
    if (value > 20) value = 20;
    peopleCount = value;
    e.target.value = peopleCount;
    renderSplitItems();
});

// Botón aplicar división
applySplitBtn.addEventListener('click', () => {
    applySplit();
});

// Botón de procesar pago
processPaymentBtn.addEventListener('click', processPayment);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeConfigurationSync();
    loadTables();
});
