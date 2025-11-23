// Lógica de validación y envío para login
(function() {
	const form = document.getElementById('loginForm');
	const emailInput = document.getElementById('correoElectronico');
	const passInput = document.getElementById('contrasena');
	const submitBtn = document.getElementById('loginSubmit');
	const emailMsg = document.getElementById('correoElectronicoValidation');
	const passMsg = document.getElementById('contrasenaValidation');
	const formError = document.getElementById('formError');

	// Base remoto desplegado (ajusta si cambia entorno)
	const API_LOGIN_URL = 'https://pos-restaurante.onrender.com/api/auth/login';

	function showValidation(el, msgEl, valid, message) {
		if (valid) {
			msgEl.textContent = '';
			msgEl.classList.remove('visible');
			el.setAttribute('aria-invalid', 'false');
		} else {
			msgEl.textContent = message;
			msgEl.classList.add('visible');
			el.setAttribute('aria-invalid', 'true');
		}
	}

	function validateEmail(value) {
		if (!value) return 'El correo es obligatorio';
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!re.test(value)) return 'Formato de correo inválido';
		return '';
	}

	function validatePassword(value) {
		if (!value) return 'La contraseña es obligatoria';
		if (value.length < 6) return 'Mínimo 6 caracteres';
		return '';
	}

	function clearFormError() { formError.textContent = ''; formError.hidden = true; }
	function setFormError(msg) { formError.textContent = msg; formError.hidden = false; }

	function setLoading(loading) {
		if (loading) {
			submitBtn.disabled = true;
			submitBtn.textContent = 'Ingresando...';
		} else {
			submitBtn.disabled = false;
			submitBtn.textContent = 'Ingresar';
		}
	}

	emailInput.addEventListener('blur', () => {
		const err = validateEmail(emailInput.value.trim());
		showValidation(emailInput, emailMsg, !err, err);
	});
	passInput.addEventListener('blur', () => {
		const err = validatePassword(passInput.value);
		showValidation(passInput, passMsg, !err, err);
	});

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		clearFormError();

		const emailVal = emailInput.value.trim();
		const passVal = passInput.value;
		const emailErr = validateEmail(emailVal);
		const passErr = validatePassword(passVal);

		showValidation(emailInput, emailMsg, !emailErr, emailErr);
		showValidation(passInput, passMsg, !passErr, passErr);

		if (emailErr || passErr) return;

		setLoading(true);
		try {
			const payload = { correoElectronico: emailVal, contrasena: passVal };
			console.log('📤 Enviando:', payload);
			
			const resp = await fetch(API_LOGIN_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			let data;
			try { data = await resp.json(); } catch(_) {}
			
			console.log('📥 Respuesta:', { status: resp.status, data });

			if (!resp.ok) {
				// Mensajes según código esperado
				if (resp.status === 401) return setFormError('Credenciales inválidas');
				if (resp.status === 403) return setFormError('Usuario inactivo');
				if (resp.status === 400) return setFormError('Campos faltantes o inválidos');
				let errMsg = 'Error al iniciar sesión';
				if (data && (data.mensaje || data.message || data.error)) {
					errMsg = data.mensaje || data.message || data.error;
				}
				return setFormError(errMsg);
			}

			// Éxito esperado: { exito, mensaje, datos: { token, ... } }
			if (data && data.exito && data.datos && data.datos.token) {
				try { 
					localStorage.setItem('token', data.datos.token);
					// Guardar información del usuario
					const userData = {
						nombreCompleto: data.datos.nombreCompleto,
						correoElectronico: data.datos.correoElectronico,
						rol: data.datos.rol,
						id: data.datos._id || data.datos.id
					};
					localStorage.setItem('user', JSON.stringify(userData));
				} catch(_) {}
				alert(`✅ Login exitoso!\nUsuario: ${data.datos.nombreCompleto}\nRol: ${data.datos.rol}`);
				window.location.href = '/dashboard.html';
			}
		} catch (err) {
			setFormError('Fallo de red, intenta nuevamente');
		} finally {
			setLoading(false);
		}
	});
})();

