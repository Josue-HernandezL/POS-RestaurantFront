// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global State
let currentTab = 'usuarios';
let currentEditingUser = null;
let users = [];
let roles = [];
let permissions = [];
let autorizaciones = [];

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const usersGrid = document.getElementById('users-grid');
const rolesContainer = document.getElementById('roles-container');
const autorizacionesTableBody = document.getElementById('autorizaciones-tbody');

// Modal Elements
const userModal = document.getElementById('user-modal');
const modalTitle = document.getElementById('modal-title');
const userForm = document.getElementById('user-form');
const submitText = document.getElementById('submit-text');

// Form Elements
const userNombreInput = document.getElementById('user-nombre');
const userCorreoInput = document.getElementById('user-correo');
const userRolSelect = document.getElementById('user-rol');
const userPinInput = document.getElementById('user-pin');
const userActivoCheckbox = document.getElementById('user-activo');

// Authentication
function getAuthToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// Utility Functions
function showLoading(element) {
    element.classList.add('loading');
}

function hideLoading(element) {
    element.classList.remove('loading');
}

function showSuccess(message) {
    // Create and show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const header = document.querySelector('.users-header');
    header.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function showError(message) {
    console.error(message);
    alert('Error: ' + message);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
}

function validatePIN(pin) {
    if (!pin) return true; // PIN is optional
    return /^\d{4,6}$/.test(pin);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Tab Management
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    // Update active tab button
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update active tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tab);
    });
    
    currentTab = tab;
    
    // Load content for the active tab
    switch (tab) {
        case 'usuarios':
            loadUsers();
            break;
        case 'roles':
            loadRoles();
            break;
        case 'autorizaciones':
            loadAutorizaciones();
            break;
    }
}

// API Functions
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        return data.usuarios || [];
    } catch (error) {
        showError('Error al cargar usuarios: ' + error.message);
        return [];
    }
}

async function createUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear usuario');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Error al crear usuario: ' + error.message);
    }
}

async function updateUser(userId, userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar usuario');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Error al actualizar usuario: ' + error.message);
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar usuario');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Error al eliminar usuario: ' + error.message);
    }
}

async function fetchRoles() {
    try {
        const response = await fetch(`${API_BASE_URL}/roles`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar roles');
        }
        
        const data = await response.json();
        return data.roles || [];
    } catch (error) {
        showError('Error al cargar roles: ' + error.message);
        return [];
    }
}

async function fetchPermissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/roles/permisos`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar permisos');
        }
        
        const data = await response.json();
        return data.permisos || [];
    } catch (error) {
        showError('Error al cargar permisos: ' + error.message);
        return [];
    }
}

async function fetchAutorizaciones() {
    try {
        const response = await fetch(`${API_BASE_URL}/autorizaciones?limite=50`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar autorizaciones');
        }
        
        const data = await response.json();
        return data.autorizaciones || [];
    } catch (error) {
        showError('Error al cargar autorizaciones: ' + error.message);
        return [];
    }
}

// Render Functions
function renderUsers(users) {
    if (!users || users.length === 0) {
        usersGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3>No hay usuarios registrados</h3>
                <p>Haz clic en "Nuevo Usuario" para agregar el primer usuario al sistema.</p>
            </div>
        `;
        return;
    }
    
    usersGrid.innerHTML = users.map(user => createUserCard(user)).join('');
    attachUserEventListeners();
}

function createUserCard(user) {
    const statusClass = user.activo ? 'activo' : 'inactivo';
    const statusText = user.activo ? 'Activo' : 'Inactivo';
    const actionText = user.activo ? 'Desactivar' : 'Activar';
    
    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-card-header">
                <div class="user-info">
                    <h3>${user.nombre}</h3>
                    <p>${user.correo}</p>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="user-card-details">
                <div class="user-detail">
                    <svg class="icon" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM8 9.5a7.5 7.5 0 00-7.5 7.5h15a7.5 7.5 0 00-7.5-7.5z" fill="currentColor"/>
                    </svg>
                    <span class="role">${getRoleName(user.rol)}</span>
                </div>
                <div class="user-detail">
                    <svg class="icon" viewBox="0 0 14 16" fill="none">
                        <path d="M10 6V4a3 3 0 10-6 0v2H3a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1zM5 4a2 2 0 114 0v2H5V4z" fill="currentColor"/>
                    </svg>
                    <span class="pin-status">PIN configurado</span>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn-action edit-user" data-user-id="${user.id}">
                    <svg class="icon" viewBox="0 0 16 16" fill="none">
                        <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    Editar
                </button>
                <button class="btn-action toggle-user" data-user-id="${user.id}" data-active="${user.activo}">
                    <svg class="icon" viewBox="0 0 16 16" fill="none">
                        <path d="M8 15A7 7 0 108 1a7 7 0 000 14zM8 4v4l3 3" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    ${actionText}
                </button>
                <button class="btn-action danger delete-user" data-user-id="${user.id}">
                    <svg class="icon" viewBox="0 0 16 16" fill="none">
                        <path d="M6 2V1H10V2H13V3H3V2H6ZM4 4H12V13H4V4Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function getRoleName(rol) {
    const roleNames = {
        'dueno': 'Dueño',
        'gerente': 'Gerente',
        'cajero': 'Cajero',
        'mesero': 'Mesero',
        'cocinero': 'Cocinero'
    };
    return roleNames[rol] || rol;
}

function renderRoles(roles) {
    if (!roles || roles.length === 0) {
        rolesContainer.innerHTML = `
            <div class="empty-state">
                <h3>No hay roles configurados</h3>
                <p>Los roles del sistema no están disponibles en este momento.</p>
            </div>
        `;
        return;
    }
    
    rolesContainer.innerHTML = roles.map(role => createRoleCard(role)).join('');
}

function createRoleCard(role) {
    const permissionsHtml = role.permisos && role.permisos.length > 0
        ? role.permisos.map(permiso => `<span class="permission-tag">${permiso}</span>`).join('')
        : '<span class="permission-tag">Sin permisos asignados</span>';
    
    return `
        <div class="role-card">
            <div class="role-card-header">
                <div class="role-name">
                    <h3>${role.nombre}</h3>
                    <span class="role-badge">Predeterminado</span>
                </div>
                <p class="role-description">${role.descripcion}</p>
            </div>
            <div class="role-permissions-section">
                <p class="permissions-label">Permisos:</p>
                <div class="permissions-grid">
                    ${permissionsHtml}
                </div>
            </div>
        </div>
    `;
}

function renderAutorizaciones(autorizaciones) {
    if (!autorizaciones || autorizaciones.length === 0) {
        autorizacionesTableBody.innerHTML = `
            <tr class="no-data">
                <td colspan="5">No hay registros de autorizaciones</td>
            </tr>
        `;
        return;
    }
    
    autorizacionesTableBody.innerHTML = autorizaciones.map(auth => `
        <tr>
            <td>${formatDate(auth.fechaHora)}</td>
            <td>${auth.accion}</td>
            <td>${auth.usuario?.nombre || 'N/A'}</td>
            <td>${auth.autorizadoPor?.nombre || 'N/A'}</td>
            <td>${JSON.stringify(auth.detalles || {})}</td>
        </tr>
    `).join('');
}

// Load Functions
async function loadUsers() {
    showLoading(usersGrid);
    users = await fetchUsers();
    renderUsers(users);
    hideLoading(usersGrid);
}

async function loadRoles() {
    showLoading(rolesContainer);
    roles = await fetchRoles();
    permissions = await fetchPermissions();
    renderRoles(roles);
    hideLoading(rolesContainer);
}

async function loadAutorizaciones() {
    showLoading(autorizacionesTableBody);
    autorizaciones = await fetchAutorizaciones();
    renderAutorizaciones(autorizaciones);
    hideLoading(autorizacionesTableBody);
}

// Event Listeners
function attachUserEventListeners() {
    // Edit user buttons
    document.querySelectorAll('.edit-user').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.closest('.edit-user').dataset.userId;
            const user = users.find(u => u.id === userId);
            if (user) {
                openEditUserModal(user);
            }
        });
    });
    
    // Toggle user status buttons
    document.querySelectorAll('.toggle-user').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('.toggle-user').dataset.userId;
            const isActive = e.target.closest('.toggle-user').dataset.active === 'true';
            await toggleUserStatus(userId, !isActive);
        });
    });
    
    // Delete user buttons
    document.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('.delete-user').dataset.userId;
            if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
                await handleDeleteUser(userId);
            }
        });
    });
}

function initModalEvents() {
    // New user button
    document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
        openNewUserModal();
    });
    
    // Modal close buttons
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);
    
    // Modal overlay click
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            closeModal();
        }
    });
    
    // Form submission
    userForm.addEventListener('submit', handleFormSubmit);
    
    // PIN validation
    userPinInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value && !validatePIN(value)) {
            e.target.setCustomValidity('El PIN debe tener entre 4 y 6 dígitos');
        } else {
            e.target.setCustomValidity('');
        }
    });
}

// Modal Functions
function openNewUserModal() {
    currentEditingUser = null;
    modalTitle.textContent = 'Nuevo Usuario';
    submitText.textContent = 'Crear Usuario';
    
    // Reset form
    userForm.reset();
    userActivoCheckbox.checked = true;
    
    // Clear validation errors
    clearFormErrors();
    
    showModal();
}

function openEditUserModal(user) {
    currentEditingUser = user;
    modalTitle.textContent = 'Editar Usuario';
    submitText.textContent = 'Actualizar Usuario';
    
    // Populate form
    userNombreInput.value = user.nombre;
    userCorreoInput.value = user.correo;
    userRolSelect.value = user.rol;
    userPinInput.value = ''; // Don't show existing PIN
    userActivoCheckbox.checked = user.activo;
    
    // Clear validation errors
    clearFormErrors();
    
    showModal();
}

function showModal() {
    userModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    userModal.classList.remove('show');
    document.body.style.overflow = '';
    currentEditingUser = null;
}

function clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        const errorMsg = group.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    });
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);
}

// Form Handling
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearFormErrors();
    
    // Get form data
    const formData = {
        nombre: userNombreInput.value.trim(),
        correo: userCorreoInput.value.trim(),
        rol: userRolSelect.value,
        activo: userActivoCheckbox.checked
    };
    
    // Add PIN if provided
    if (userPinInput.value.trim()) {
        formData.pinSeguridad = userPinInput.value.trim();
    }
    
    // Validate form
    let hasErrors = false;
    
    if (!formData.nombre) {
        showFieldError(userNombreInput, 'El nombre es requerido');
        hasErrors = true;
    }
    
    if (!formData.correo) {
        showFieldError(userCorreoInput, 'El correo es requerido');
        hasErrors = true;
    } else if (!validateEmail(formData.correo)) {
        showFieldError(userCorreoInput, 'El formato del correo no es válido');
        hasErrors = true;
    }
    
    if (!formData.rol) {
        showFieldError(userRolSelect, 'El rol es requerido');
        hasErrors = true;
    }
    
    if (formData.pinSeguridad && !validatePIN(formData.pinSeguridad)) {
        showFieldError(userPinInput, 'El PIN debe tener entre 4 y 6 dígitos');
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Submit form
    try {
        showLoading(userForm);
        
        if (currentEditingUser) {
            await updateUser(currentEditingUser.id, formData);
            showSuccess('Usuario actualizado correctamente');
        } else {
            await createUser(formData);
            showSuccess('Usuario creado correctamente');
        }
        
        closeModal();
        loadUsers();
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading(userForm);
    }
}

async function toggleUserStatus(userId, newStatus) {
    try {
        await updateUser(userId, { activo: newStatus });
        showSuccess(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`);
        loadUsers();
    } catch (error) {
        showError(error.message);
    }
}

async function handleDeleteUser(userId) {
    try {
        await deleteUser(userId);
        showSuccess('Usuario eliminado correctamente');
        loadUsers();
    } catch (error) {
        showError(error.message);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModalEvents();
    switchTab('usuarios'); // Start with users tab
});

// Export functions for testing (if needed)
window.usersAndRoles = {
    loadUsers,
    loadRoles,
    loadAutorizaciones,
    createUser,
    updateUser,
    deleteUser
};