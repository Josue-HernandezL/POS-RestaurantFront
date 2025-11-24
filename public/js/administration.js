const API_URL = 'https://pos-restaurante.onrender.com/api';
const CONFIG_CACHE_KEY = 'posRestaurantConfig';

function cacheConfigurationLocally(config) {
    try {
        localStorage.setItem(
            CONFIG_CACHE_KEY,
            JSON.stringify({
                datos: config,
                actualizadoEn: Date.now()
            })
        );
    } catch (error) {
        console.warn('No se pudo guardar la configuración en cache', error);
    }
}

function broadcastConfigurationUpdate(config) {
    cacheConfigurationLocally(config);
    window.dispatchEvent(new CustomEvent('config:updated', { detail: config }));
}

// Elementos del DOM
const restaurantNameInput = document.getElementById('restaurantName');
const addressInput = document.getElementById('address');
const phoneInput = document.getElementById('phone');
const notifyOrdersCheckbox = document.getElementById('notifyOrders');
const notifyReservationsCheckbox = document.getElementById('notifyReservations');
const taxPercentageInput = document.getElementById('taxPercentage');
const tip10Checkbox = document.getElementById('tip10');
const tip15Checkbox = document.getElementById('tip15');
const tip20Checkbox = document.getElementById('tip20');
const saveConfigBtn = document.getElementById('saveConfigBtn');

// Configuración actual
let currentConfig = null;

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
    alert(message);
}

// Cargar configuración
async function loadConfiguration() {
    try {
        const response = await fetch(`${API_URL}/configuracion`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al cargar la configuración');
        }

        const data = await response.json();
        currentConfig = data.datos;
        
        displayConfiguration(currentConfig);
        broadcastConfigurationUpdate(currentConfig);
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar la configuración', 'error');
    }
}

// Mostrar configuración en el formulario
function displayConfiguration(config) {
    // Información del restaurante
    if (config.restaurante) {
        restaurantNameInput.value = config.restaurante.nombre || '';
        addressInput.value = config.restaurante.direccion || '';
        phoneInput.value = config.restaurante.telefono || '';
    }

    // Notificaciones
    if (config.notificaciones) {
        notifyOrdersCheckbox.checked = config.notificaciones.nuevasOrdenes !== false;
        notifyReservationsCheckbox.checked = config.notificaciones.nuevasReservaciones !== false;
    }

    // Impuestos
    if (config.impuestos) {
        taxPercentageInput.value = config.impuestos.porcentajeIVA || 16;
    }

    // Propinas
    if (config.propinas) {
        // Las opciones de propina en el API son porcentajes numéricos
        // Los checkboxes representan si están habilitados (por ahora siempre true)
        tip10Checkbox.checked = config.propinas.opcion1 !== undefined;
        tip15Checkbox.checked = config.propinas.opcion2 !== undefined;
        tip20Checkbox.checked = config.propinas.opcion3 !== undefined;
    }
}

// Guardar configuración
async function saveConfiguration() {
    try {
        saveConfigBtn.disabled = true;
        saveConfigBtn.textContent = 'Guardando...';

        // Preparar datos de restaurante
        const restaurantData = {
            nombre: restaurantNameInput.value.trim(),
            direccion: addressInput.value.trim(),
            telefono: phoneInput.value.trim()
        };

        // Guardar información del restaurante
        const restaurantResponse = await fetch(`${API_URL}/configuracion/restaurante`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(restaurantData)
        });

        if (!restaurantResponse.ok) {
            const error = await restaurantResponse.json();
            throw new Error(error.mensaje || 'Error al guardar información del restaurante');
        }

        // Guardar notificaciones
        const notificationsData = {
            nuevasOrdenes: notifyOrdersCheckbox.checked,
            nuevasReservaciones: notifyReservationsCheckbox.checked
        };

        const notificationsResponse = await fetch(`${API_URL}/configuracion/notificaciones`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(notificationsData)
        });

        if (!notificationsResponse.ok) {
            const error = await notificationsResponse.json();
            throw new Error(error.mensaje || 'Error al guardar notificaciones');
        }

        // Guardar impuestos
        const taxData = {
            porcentajeIVA: parseFloat(taxPercentageInput.value) || 16,
            aplicarATodos: true
        };

        const taxResponse = await fetch(`${API_URL}/configuracion/impuestos`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(taxData)
        });

        if (!taxResponse.ok) {
            const error = await taxResponse.json();
            throw new Error(error.mensaje || 'Error al guardar impuestos');
        }

        // Guardar propinas
        const tipsData = {
            opcion1: tip10Checkbox.checked ? 10 : 0,
            opcion2: tip15Checkbox.checked ? 15 : 0,
            opcion3: tip20Checkbox.checked ? 20 : 0,
            permitirPersonalizada: true
        };

        const tipsResponse = await fetch(`${API_URL}/configuracion/propinas`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(tipsData)
        });

        if (!tipsResponse.ok) {
            const error = await tipsResponse.json();
            throw new Error(error.mensaje || 'Error al guardar propinas');
        }

        showNotification('Configuración guardada exitosamente', 'success');
        
        // Recargar configuración
        await loadConfiguration();

    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    } finally {
        saveConfigBtn.disabled = false;
        saveConfigBtn.textContent = 'Guardar Configuración';
    }
}

// Event Listeners
saveConfigBtn.addEventListener('click', saveConfiguration);

// Validación en tiempo real del porcentaje de IVA
taxPercentageInput.addEventListener('input', (e) => {
    let value = parseFloat(e.target.value);
    if (value < 0) e.target.value = 0;
    if (value > 100) e.target.value = 100;
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadConfiguration();
});