// Configuración de la API
const API_URL = 'https://pos-restaurante.onrender.com/api/auth/register';

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const submitButton = document.getElementById('submitButton');
const errorMessage = document.getElementById('errorMessage');

// Función para mostrar mensajes de error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Función para validar el formulario
function validateForm(formData) {
    const { nombreCompleto, correoElectronico, rol, contrasena, confirmarContrasena } = formData;
    
    // Validar nombre completo
    if (nombreCompleto.trim().length < 3) {
        showError('El nombre completo debe tener al menos 3 caracteres');
        return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoElectronico)) {
        showError('Por favor ingresa un correo electrónico válido');
        return false;
    }
    
    // Validar rol
    if (!rol) {
        showError('Por favor selecciona un rol');
        return false;
    }
    
    // Validar contraseña
    if (contrasena.length < 8) {
        showError('La contraseña debe tener al menos 8 caracteres');
        return false;
    }
    
    // Validar confirmación de contraseña
    if (contrasena !== confirmarContrasena) {
        showError('Las contraseñas no coinciden');
        return false;
    }
    
    return true;
}

// Función para registrar usuario
async function registerUser(userData) {
    try {
        console.log('Enviando datos:', userData);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        console.log('Response status:', response.status);
        
        // Intentar parsear la respuesta
        let data;
        try {
            data = await response.json();
            console.log('Response data:', data);
        } catch (parseError) {
            console.error('Error parseando JSON:', parseError);
            throw new Error('Error al comunicarse con el servidor');
        }
        
        if (!response.ok) {
            // Extraer mensaje de error más detallado
            const errorMsg = data.error || data.mensaje || data.message || data.msg || 'Error al crear la cuenta';
            throw new Error(errorMsg);
        }
        
        return data;
    } catch (error) {
        // Si es un error de red
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
        }
        throw error;
    }
}

// Manejador del envío del formulario
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = {
        nombreCompleto: document.getElementById('nombreCompleto').value.trim(),
        correoElectronico: document.getElementById('correoElectronico').value.trim(),
        rol: document.getElementById('rol').value,
        contrasena: document.getElementById('contrasena').value,
        confirmarContrasena: document.getElementById('confirmarContrasena').value
    };
    
    // Validar formulario
    if (!validateForm(formData)) {
        return;
    }
    
    // Preparar datos para el backend (sin confirmarContrasena)
    const { confirmarContrasena, ...userData } = formData;
    
    // Deshabilitar botón y mostrar estado de carga
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    errorMessage.style.display = 'none';
    
    try {
        // Registrar usuario
        const result = await registerUser(userData);
        
        // Mostrar mensaje de éxito
        alert('¡Cuenta creada exitosamente! Redirigiendo al inicio de sesión...');
        
        // Redirigir a la página de login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error al registrar:', error);
        showError(error.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
        
        // Habilitar botón nuevamente
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
    }
});

// Validación en tiempo real de las contraseñas
const contrasenaInput = document.getElementById('contrasena');
const confirmarContrasenaInput = document.getElementById('confirmarContrasena');

confirmarContrasenaInput.addEventListener('input', () => {
    if (confirmarContrasenaInput.value && contrasenaInput.value !== confirmarContrasenaInput.value) {
        confirmarContrasenaInput.setCustomValidity('Las contraseñas no coinciden');
    } else {
        confirmarContrasenaInput.setCustomValidity('');
    }
});

// Limpiar mensajes de error cuando el usuario empieza a escribir
const formInputs = registerForm.querySelectorAll('input, select');
formInputs.forEach(input => {
    input.addEventListener('input', () => {
        errorMessage.style.display = 'none';
    });
});