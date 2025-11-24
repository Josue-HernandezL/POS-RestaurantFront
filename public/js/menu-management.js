// Configuración de la API
const API_URL = 'https://pos-restaurante.onrender.com/api';

// Estado global
let categories = [];
let items = [];
let editingItemId = null;
let editingCategoryId = null;

// Elementos del DOM
const categoriesContainer = document.getElementById('categoriesContainer');
const btnNuevaCategoria = document.getElementById('btnNuevaCategoria');
const btnNuevoItem = document.getElementById('btnNuevoItem');
const modalCategoria = document.getElementById('modalCategoria');
const modalItem = document.getElementById('modalItem');
const formCategoria = document.getElementById('formCategoria');
const formItem = document.getElementById('formItem');
const btnCancelarCategoria = document.getElementById('btnCancelarCategoria');
const btnCancelarItem = document.getElementById('btnCancelarItem');
const itemCategoriaSelect = document.getElementById('itemCategoria');
const modalItemTitle = document.getElementById('modalItemTitle');
const btnSubmitItem = document.getElementById('btnSubmitItem');
const modalCategoryTitle = document.getElementById('modalCategoryTitle');
const btnSubmitCategory = document.getElementById('btnSubmitCategory');

// Obtener el token de autenticación
function getAuthToken() {
    return localStorage.getItem('token');
}

// Headers para las peticiones
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// Verificar autenticación
function checkAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '/views/login.html';
        return false;
    }
    return true;
}

// Decodificar el token JWT para obtener información del usuario
function getUserFromToken() {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
}

// Verificar si el usuario tiene permisos de admin o gerente
function hasPermissions() {
    const user = getUserFromToken();
    if (!user || !user.rol) return false;
    
    // Roles permitidos según el backend (categoriaRoutes.js y itemMenuRoutes.js)
    const allowedRoles = ['dueno', 'gerente'];
    return allowedRoles.includes(user.rol.toLowerCase());
}

// Cargar categorías
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categorias`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al cargar categorías');
        }

        const data = await response.json();
        categories = data.datos || [];
        
        // Actualizar el select de categorías en el modal de items
        updateCategorySelect();
        
        // Cargar items después de tener las categorías
        await loadItems();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar las categorías');
    }
}

// Cargar items
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/items`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al cargar items');
        }

        const data = await response.json();
        items = data.datos || [];
        
        renderCategories();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los items');
    }
}

// Actualizar el select de categorías
function updateCategorySelect() {
    itemCategoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nombre;
        itemCategoriaSelect.appendChild(option);
    });
}

// Renderizar categorías con sus items
function renderCategories() {
    if (categories.length === 0) {
        categoriesContainer.innerHTML = `
            <div class="empty-state">
                <h3>No hay categorías</h3>
                <p>Crea tu primera categoría para comenzar a agregar items al menú</p>
            </div>
        `;
        return;
    }

    categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItems = items.filter(item => item.categoriaId === category.id);
        
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        
        categorySection.innerHTML = `
            <div class="category-header-container">
                <h2 class="category-header">${category.nombre}</h2>
                <div class="category-actions">
                    <button class="btn-icon" onclick="editCategory('${category.id}')" title="Editar categoría">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M12.75 2.25L15.75 5.25L5.25 15.75H2.25V12.75L12.75 2.25Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="deleteCategory('${category.id}')" title="Eliminar categoría">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3.75 5.25H14.25M6 8.25V12.75M12 8.25V12.75M6.75 5.25V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V5.25M4.5 5.25H13.5V15C13.5 15.4142 13.1642 15.75 12.75 15.75H5.25C4.83579 15.75 4.5 15.4142 4.5 15V5.25Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="items-list" id="category-${category.id}">
                ${categoryItems.length === 0 
                    ? '<p style="color: #6B7280; font-size: 13.6px;">No hay items en esta categoría</p>'
                    : categoryItems.map(item => createItemCard(item)).join('')
                }
            </div>
        `;
        
        categoriesContainer.appendChild(categorySection);
    });
}

// Crear tarjeta de item
function createItemCard(item) {
    return `
        <div class="item-card">
            <div class="item-info">
                <h3 class="item-name">${item.nombre}</h3>
                <p class="item-description">${item.descripcion || ''}</p>
            </div>
            <div class="item-actions">
                <span class="item-price">$${item.precio.toFixed(2)}</span>
                <button class="btn-icon" onclick="editItem('${item.id}')" title="Editar">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M12.75 2.25L15.75 5.25L5.25 15.75H2.25V12.75L12.75 2.25Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn-icon" onclick="deleteItem('${item.id}')" title="Eliminar">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3.75 5.25H14.25M6 8.25V12.75M12 8.25V12.75M6.75 5.25V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V5.25M4.5 5.25H13.5V15C13.5 15.4142 13.1642 15.75 12.75 15.75H5.25C4.83579 15.75 4.5 15.4142 4.5 15V5.25Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// Abrir modal de nueva categoría
btnNuevaCategoria.addEventListener('click', () => {
    editingCategoryId = null;
    formCategoria.reset();
    modalCategoryTitle.textContent = 'Nueva Categoría';
    btnSubmitCategory.textContent = 'Crear Categoría';
    modalCategoria.classList.add('active');
});

// Abrir modal de nuevo item
btnNuevoItem.addEventListener('click', () => {
    editingItemId = null;
    formItem.reset();
    modalItemTitle.textContent = 'Nuevo Item';
    btnSubmitItem.textContent = 'Crear Item';
    modalItem.classList.add('active');
});

// Cerrar modales
btnCancelarCategoria.addEventListener('click', () => {
    modalCategoria.classList.remove('active');
});

btnCancelarItem.addEventListener('click', () => {
    modalItem.classList.remove('active');
});

// Cerrar modal al hacer clic fuera
modalCategoria.addEventListener('click', (e) => {
    if (e.target === modalCategoria) {
        modalCategoria.classList.remove('active');
    }
});

modalItem.addEventListener('click', (e) => {
    if (e.target === modalItem) {
        modalItem.classList.remove('active');
    }
});

// Crear o editar categoría
formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar permisos antes de intentar crear/editar
    if (!hasPermissions()) {
        showError('No tienes permisos para gestionar categorías. Se requiere rol de dueño o gerente.');
        return;
    }
    
    const nombre = document.getElementById('categoriaNombre').value;
    const descripcion = document.getElementById('categoriaDescripcion').value;
    
    try {
        const url = editingCategoryId 
            ? `${API_URL}/categorias/${editingCategoryId}`
            : `${API_URL}/categorias`;
        
        const method = editingCategoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify({ nombre, descripcion })
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (response.status === 403) {
                throw new Error('No tienes permisos para gestionar categorías. Se requiere rol de dueño o gerente.');
            }
            throw new Error(error.mensaje || 'Error al guardar categoría');
        }
        
        modalCategoria.classList.remove('active');
        formCategoria.reset();
        const wasEditing = editingCategoryId !== null;
        editingCategoryId = null;
        
        // Recargar categorías
        await loadCategories();
        
        showSuccess(wasEditing ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
});

// Crear/Editar item
formItem.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar permisos antes de intentar crear/editar
    if (!hasPermissions()) {
        showError('No tienes permisos para gestionar items del menú. Se requiere rol de dueño o gerente.');
        return;
    }
    
    const nombre = document.getElementById('itemNombre').value;
    const categoriaId = document.getElementById('itemCategoria').value;
    const precio = parseFloat(document.getElementById('itemPrecio').value);
    const disponibilidad = document.getElementById('itemDisponibilidad').value === 'true';
    const descripcion = document.getElementById('itemDescripcion').value;
    
    if (!categoriaId) {
        showError('Por favor selecciona una categoría');
        return;
    }
    
    try {
        const url = editingItemId 
            ? `${API_URL}/items/${editingItemId}`
            : `${API_URL}/items`;
        
        const method = editingItemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify({ 
                nombre, 
                categoriaId, 
                precio, 
                disponibilidad, 
                descripcion 
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (response.status === 403) {
                throw new Error('No tienes permisos para gestionar items del menú. Se requiere rol de dueño o gerente.');
            }
            throw new Error(error.mensaje || 'Error al guardar el item');
        }
        
        modalItem.classList.remove('active');
        formItem.reset();
        editingItemId = null;
        
        // Recargar items
        await loadItems();
        
        showSuccess(editingItemId ? 'Item actualizado exitosamente' : 'Item creado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
});

// Editar categoría
window.editCategory = async function(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    editingCategoryId = categoryId;
    
    document.getElementById('categoriaNombre').value = category.nombre;
    document.getElementById('categoriaDescripcion').value = category.descripcion || '';
    
    modalCategoryTitle.textContent = 'Editar Categoría';
    btnSubmitCategory.textContent = 'Guardar Cambios';
    modalCategoria.classList.add('active');
};

// Eliminar categoría
window.deleteCategory = async function(categoryId) {
    // Verificar permisos
    if (!hasPermissions()) {
        showError('No tienes permisos para eliminar categorías. Se requiere rol de dueño o gerente.');
        return;
    }
    
    // Verificar si la categoría tiene items
    const categoryItems = items.filter(item => item.categoriaId === categoryId);
    if (categoryItems.length > 0) {
        showError(`No se puede eliminar la categoría porque tiene ${categoryItems.length} item(s) asociado(s). Elimina primero los items.`);
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/categorias/${categoryId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tienes permisos para eliminar categorías. Se requiere rol de dueño o gerente.');
            }
            const error = await response.json();
            throw new Error(error.mensaje || 'Error al eliminar la categoría');
        }
        
        // Recargar categorías
        await loadCategories();
        
        showSuccess('Categoría eliminada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
};

// Editar item
window.editItem = async function(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    editingItemId = itemId;
    
    document.getElementById('itemNombre').value = item.nombre;
    document.getElementById('itemCategoria').value = item.categoriaId;
    document.getElementById('itemPrecio').value = item.precio;
    document.getElementById('itemDisponibilidad').value = item.disponibilidad.toString();
    document.getElementById('itemDescripcion').value = item.descripcion || '';
    
    modalItemTitle.textContent = 'Editar Item';
    btnSubmitItem.textContent = 'Guardar Cambios';
    modalItem.classList.add('active');
};

// Eliminar item
window.deleteItem = async function(itemId) {
    // Verificar permisos antes de intentar eliminar
    if (!hasPermissions()) {
        showError('No tienes permisos para eliminar items del menú. Se requiere rol de dueño o gerente.');
        return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar este item?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tienes permisos para eliminar items del menú. Se requiere rol de dueño o gerente.');
            }
            throw new Error('Error al eliminar el item');
        }
        
        // Recargar items
        await loadItems();
        
        showSuccess('Item eliminado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
};

// Mostrar mensaje de éxito
function showSuccess(message) {
    // Implementar notificación de éxito (puedes usar una librería o crear una custom)
    alert(message);
}

// Mostrar mensaje de error
function showError(message) {
    // Implementar notificación de error (puedes usar una librería o crear una custom)
    alert(message);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        // Verificar permisos y ocultar botones si no los tiene
        const user = getUserFromToken();
        if (!hasPermissions()) {
            console.warn('Usuario sin permisos de administración:', user?.rol);
            // Ocultar botones de acción para usuarios sin permisos
            if (btnNuevaCategoria) btnNuevaCategoria.style.display = 'none';
            if (btnNuevoItem) btnNuevoItem.style.display = 'none';
            
            // Mostrar mensaje informativo
            const headerInfo = document.querySelector('.header-info');
            if (headerInfo) {
                const warningMsg = document.createElement('p');
                warningMsg.style.color = '#DC2626';
                warningMsg.style.fontSize = '12px';
                warningMsg.style.marginTop = '8px';
                warningMsg.textContent = `Tu rol actual (${user?.rol || 'sin rol'}) solo permite visualizar el menú. Se requiere rol de dueño o gerente para editar.`;
                headerInfo.appendChild(warningMsg);
            }
        }
        
        loadCategories();
    }
});
