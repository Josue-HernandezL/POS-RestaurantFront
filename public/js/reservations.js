const API_BASE_URL = 'https://pos-restaurante.onrender.com/api';

// Estado de la aplicación
let reservations = [];
let editingReservationId = null;
let tables = [];

// Elementos del DOM
const reservationsGrid = document.getElementById('reservationsGrid');
const btnNewReservation = document.getElementById('btnNewReservation');
const modalOverlay = document.getElementById('modalOverlay');
const reservationForm = document.getElementById('reservationForm');
const btnCancel = document.getElementById('btnCancel');
const modalTitle = document.getElementById('modalTitle');
const submitText = document.getElementById('submitText');

// Elementos del formulario
const inputName = document.getElementById('inputName');
const inputPhone = document.getElementById('inputPhone');
const inputDate = document.getElementById('inputDate');
const inputTime = document.getElementById('inputTime');
const inputPeople = document.getElementById('inputPeople');
const inputTable = document.getElementById('inputTable');
const inputNotes = document.getElementById('inputNotes');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadReservations();
    loadTables();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    btnNewReservation.addEventListener('click', openNewReservationModal);
    btnCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    reservationForm.addEventListener('submit', handleSubmit);
}

// Cargar reservaciones
async function loadReservations() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/public/views/login.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/reservaciones`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar reservaciones');
        }

        const data = await response.json();
        reservations = Array.isArray(data) ? data : data?.datos || [];
        renderReservations();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar las reservaciones', 'error');
    }
}

// Cargar mesas disponibles
async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/mesas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener mesas');
        }

        const data = await response.json();
        tables = Array.isArray(data) ? data : data?.datos || [];
        populateTablesSelect();
    } catch (error) {
        console.error('Error al cargar mesas:', error);
    }
}

// Poblar select de mesas
function populateTablesSelect() {
    inputTable.innerHTML = '<option value="">Sin asignar</option>';
    tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        option.textContent = `Mesa ${table.numero}`;
        inputTable.appendChild(option);
    });
}

function toDate(value) {
    if (!value) return null;
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed) ? null : parsed;
    }
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
    }
    return null;
}

// Renderizar reservaciones
function renderReservations() {
    if (reservations.length === 0) {
        reservationsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6b7280;">
                <p>No hay reservaciones disponibles</p>
            </div>
        `;
        return;
    }

    reservationsGrid.innerHTML = reservations.map(reservation => createReservationCard(reservation)).join('');

    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editReservation(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteReservation(btn.dataset.id));
    });

    document.querySelectorAll('.btn-mark-seated').forEach(btn => {
        btn.addEventListener('click', () => markAsSeated(btn.dataset.id));
    });
}

// Crear tarjeta de reservación
function normalizeState(value) {
    if (value === null || value === undefined) return 'pendiente';
    return value.toString().trim().toLowerCase();
}

function createReservationCard(reservation) {
    const estado = normalizeState(reservation.estado);
    const statusText = getStatusText(estado);
    const showMarkSeatedBtn = true; // TEMPORAL: mostrar en todas para debug
    const showNotes = estado === 'confirmada' && reservation.notas;
    
    console.log('Debug - Reservación:', reservation.nombreCliente, 'Estado original:', reservation.estado, 'Estado normalizado:', estado, 'Mostrar botón:', showMarkSeatedBtn);
    
    // Formatear fecha
    const fecha = toDate(reservation.fecha);
    const fechaFormateada = fecha ? fecha.toLocaleDateString('es-MX') : 'Sin fecha';
    
    // Formatear hora
    const horaFormateada = reservation.hora || '00:00';

    return `
        <div class="reservation-card ${estado}">
            <div class="card-header">
                <div class="card-client-info">
                    <div class="client-name">${reservation.nombreCliente}</div>
                    <div class="client-phone">
                        <svg viewBox="0 0 14 14" fill="none">
                            <path d="M2.333 1.167h2.334l1.166 2.916-1.166.875a7 7 0 003.5 3.5l.875-1.166 2.916 1.166v2.334A1.167 1.167 0 0110.792 12 9.333 9.333 0 011.167 2.375 1.167 1.167 0 012.333 1.167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${reservation.telefono}
                    </div>
                </div>
                <div class="status-badge">${statusText}</div>
            </div>

            <div class="card-details">
                <div class="detail-item">
                    <svg viewBox="0 0 18 18" fill="none">
                        <path d="M14.25 3h-10.5A1.5 1.5 0 002.25 4.5v10.5A1.5 1.5 0 003.75 16.5h10.5a1.5 1.5 0 001.5-1.5V4.5A1.5 1.5 0 0014.25 3zM12 1.5v3M6 1.5v3M2.25 7.5h13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${fechaFormateada}</span>
                </div>
                <div class="detail-item">
                    <svg viewBox="0 0 18 18" fill="none">
                        <path d="M9 16.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM9 4.5v4.5l3 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${horaFormateada}</span>
                </div>
                <div class="detail-item">
                    <svg viewBox="0 0 18 18" fill="none">
                        <path d="M12 15.75v-1.5a3 3 0 00-3-3H4.5a3 3 0 00-3 3v1.5M7.5 8.25a3 3 0 100-6 3 3 0 000 6zM16.5 15.75v-1.5a3 3 0 00-2.25-2.902M11.25 2.348a3 3 0 010 5.804" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${reservation.numeroPersonas} personas</span>
                </div>
                ${reservation.mesaAsignada ? `
                <div class="detail-item">
                    <span>Mesa: ${reservation.mesaAsignada}</span>
                </div>
                ` : ''}
            </div>

            ${showNotes ? `
            <div class="card-notes">${reservation.notas}</div>
            ` : ''}

            <div class="card-actions-row">
                <div class="card-actions">
                    <button class="card-btn btn-edit" data-id="${reservation.id}">
                        <svg viewBox="0 0 16 16" fill="none">
                            <path d="M11.333 2.667a1.886 1.886 0 112.667 2.666L5 14.333l-3.667 1 1-3.666L11.333 2.667z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Editar
                    </button>
                    <button class="card-btn btn-delete" data-id="${reservation.id}">
                        <svg viewBox="0 0 16 16" fill="none">
                            <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Eliminar
                    </button>
                </div>
                ${showMarkSeatedBtn ? `
                <button class="card-btn card-btn-full btn-mark-seated" data-id="${reservation.id}">
                    Marcar como Sentada
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Obtener texto del estado
function getStatusText(estado) {
    const estadoLower = normalizeState(estado);
    const statusMap = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'sentada': 'Sentada',
        'terminada': 'Terminada',
        'cancelada': 'Cancelada'
    };
    return statusMap[estadoLower] || estado;
}

// Abrir modal de nueva reservación
function openNewReservationModal() {
    editingReservationId = null;
    modalTitle.textContent = 'Nueva Reservación';
    submitText.textContent = 'Crear Reservación';
    reservationForm.reset();
    
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    inputDate.min = today;
    
    modalOverlay.classList.add('active');
}

// Editar reservación
async function editReservation(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/reservaciones/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar la reservación');
        }

        const data = await response.json();
        const reservation = data?.datos || data;
        
        editingReservationId = id;
        modalTitle.textContent = 'Editar Reservación';
        submitText.textContent = 'Guardar Cambios';
        
        // Llenar el formulario con los datos
        inputName.value = reservation.nombreCliente;
        inputPhone.value = reservation.telefono;
        
        // Formatear fecha para input date
        const fecha = toDate(reservation.fecha);
        inputDate.value = fecha ? fecha.toISOString().split('T')[0] : '';
        
        inputTime.value = reservation.hora || '';
        inputPeople.value = reservation.numeroPersonas;
        inputTable.value = reservation.mesaAsignada || '';
        inputNotes.value = reservation.notas || '';
        
        modalOverlay.classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar la reservación', 'error');
    }
}

// Eliminar reservación
async function deleteReservation(id) {
    if (!confirm('¿Estás seguro de eliminar esta reservación?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/reservaciones/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.mensaje || 'Error al eliminar la reservación');
        }

        showNotification('Reservación eliminada', 'success');
        await loadReservations();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al eliminar la reservación', 'error');
    }
}

// Marcar como sentada
async function markAsSeated(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/reservaciones/${id}/sentar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado');
        }

        showNotification('Reservación marcada como sentada', 'success');
        loadReservations();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar el estado', 'error');
    }
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();

    const data = {
        nombreCliente: inputName.value.trim(),
        telefono: inputPhone.value.trim(),
        fecha: inputDate.value,
        hora: inputTime.value,
        numeroPersonas: parseInt(inputPeople.value),
        mesaAsignada: inputTable.value || null,
        notas: inputNotes.value.trim() || null
    };

    try {
        const token = localStorage.getItem('token');
        const url = editingReservationId 
            ? `${API_BASE_URL}/reservaciones/${editingReservationId}`
            : `${API_BASE_URL}/reservaciones`;
        
        const method = editingReservationId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar la reservación');
        }

        const message = editingReservationId 
            ? 'Reservación actualizada exitosamente'
            : 'Reservación creada exitosamente';
        
        showNotification(message, 'success');
        closeModal();
        loadReservations();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Cerrar modal
function closeModal() {
    modalOverlay.classList.remove('active');
    reservationForm.reset();
    editingReservationId = null;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
