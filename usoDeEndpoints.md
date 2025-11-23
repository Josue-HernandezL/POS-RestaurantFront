# POS Restaurant API

API REST para sistema de punto de venta de restaurante usando Express y Firebase.

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Endpoints de Autenticación](#endpoints-de-autenticación)
- [Endpoints de Gestión de Menú](#endpoints-de-gestión-de-menú)
  - [Categorías](#categorías)
  - [Ítems del Menú](#ítems-del-menú)
- [Endpoints de Reservaciones](#endpoints-de-reservaciones)
- [Endpoints de Configuración](#endpoints-de-configuración)
- [Roles Disponibles](#roles-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)

## Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase
- Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
- Ve a **Project Settings → Service Accounts**
- Haz clic en **"Generar nueva clave privada"**
- Guarda el archivo JSON descargado como `serviceAccountKey.json` en la raíz del proyecto
- Ve a **Firestore Database** y haz clic en **"Crear base de datos"**

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz con:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRE=24h
```

### 4. Iniciar el servidor
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## Endpoints de Autenticación

### 📝 Registro de Usuario

**Endpoint:** `POST /api/auth/register`

**Descripción:** Crea una nueva cuenta de usuario en el sistema.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "nombreCompleto": "Juan Pérez",
  "correoElectronico": "juan@example.com",
  "rol": "cajero",
  "contrasena": "password123"
}
```

**Campos:**
- `nombreCompleto` (string, requerido): Nombre completo del usuario (3-100 caracteres)
- `correoElectronico` (string, requerido): Email válido y único
- `rol` (string, requerido): Rol del usuario (ver [Roles Disponibles](#roles-disponibles))
- `contrasena` (string, requerido): Contraseña (mínimo 6 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Usuario registrado exitosamente",
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes o inválidos
- `409`: El correo electrónico ya está registrado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "contrasena": "password123"
  }'
```

---

### 🔐 Inicio de Sesión

**Endpoint:** `POST /api/auth/login`

**Descripción:** Autentica un usuario y devuelve un token JWT.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "correoElectronico": "juan@example.com",
  "contrasena": "password123"
}
```

**Campos:**
- `correoElectronico` (string, requerido): Email de la cuenta
- `contrasena` (string, requerido): Contraseña de la cuenta

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Inicio de sesión exitoso",
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes
- `401`: Credenciales inválidas
- `403`: Usuario inactivo
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correoElectronico": "juan@example.com",
    "contrasena": "password123"
  }'
```

---

### 👤 Obtener Perfil del Usuario

**Endpoint:** `GET /api/auth/perfil`

**Descripción:** Obtiene la información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "uid": "abc123xyz",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "rol": "cajero",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `401`: Token no proporcionado, inválido o expirado
- `404`: Usuario no encontrado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Endpoints de Gestión de Menú

### Categorías

#### 📁 Crear Categoría

**Endpoint:** `POST /api/categorias`

**Descripción:** Crea una nueva categoría para el menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Bebidas",
  "descripcion": "Bebidas frías y calientes"
}
```

**Campos:**
- `nombre` (string, requerido): Nombre de la categoría (3-50 caracteres, único)
- `descripcion` (string, requerido): Descripción de la categoría (máx. 200 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Categoría creada exitosamente",
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes o inválidos
- `401`: Token no proporcionado o inválido
- `403`: Sin permisos (no es admin ni gerente)
- `409`: Ya existe una categoría con ese nombre
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/categorias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes"
  }'
```

---

#### 📋 Listar Categorías

**Endpoint:** `GET /api/categorias`

**Descripción:** Obtiene todas las categorías.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `activo` (boolean): Filtrar por estado activo (`true` o `false`)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "cat123abc",
      "nombre": "Bebidas",
      "descripcion": "Bebidas frías y calientes",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "activo": true
    },
    {
      "id": "cat456def",
      "nombre": "Entradas",
      "descripcion": "Aperitivos y entradas",
      "creadoEn": "2025-11-20T11:00:00.000Z",
      "actualizadoEn": "2025-11-20T11:00:00.000Z",
      "activo": true
    }
  ],
  "total": 2
}
```

**Ejemplo con cURL:**
```bash
# Todas las categorías
curl -X GET http://localhost:3000/api/categorias \
  -H "Authorization: Bearer {token}"

# Solo categorías activas
curl -X GET "http://localhost:3000/api/categorias?activo=true" \
  -H "Authorization: Bearer {token}"
```

---

#### 🔍 Obtener Categoría por ID

**Endpoint:** `GET /api/categorias/:id`

**Descripción:** Obtiene los detalles de una categoría específica.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/categorias/cat123abc \
  -H "Authorization: Bearer {token}"
```

---

#### ✏️ Actualizar Categoría

**Endpoint:** `PUT /api/categorias/:id`

**Descripción:** Actualiza una categoría existente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Bebidas Premium",
  "descripcion": "Bebidas premium y especiales",
  "activo": true
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Categoría actualizada exitosamente",
  "datos": {
    "id": "cat123abc",
    "nombre": "Bebidas Premium",
    "descripcion": "Bebidas premium y especiales",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T15:45:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos
- `403`: Sin permisos
- `404`: Categoría no encontrada
- `409`: El nuevo nombre ya existe

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/categorias/cat123abc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Bebidas Premium"
  }'
```

---

#### 🗑️ Eliminar Categoría

**Endpoint:** `DELETE /api/categorias/:id`

**Descripción:** Elimina una categoría (soft delete - marca como inactiva).

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Categoría eliminada exitosamente"
}
```

**Errores posibles:**
- `400`: La categoría tiene ítems asociados activos
- `403`: Sin permisos
- `404`: Categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/categorias/cat123abc \
  -H "Authorization: Bearer {token}"
```

---

### Ítems del Menú

#### 🍽️ Crear Ítem del Menú

**Endpoint:** `POST /api/items`

**Descripción:** Crea un nuevo ítem en el menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Café Americano",
  "categoriaId": "cat123abc",
  "precio": 35.00,
  "disponibilidad": true,
  "descripcion": "Café americano preparado con granos seleccionados"
}
```

**Campos:**
- `nombre` (string, requerido): Nombre del ítem (3-100 caracteres)
- `categoriaId` (string, requerido): ID de la categoría (debe existir y estar activa)
- `precio` (number, requerido): Precio del ítem (≥ 0)
- `disponibilidad` (boolean, opcional): Si el ítem está disponible (default: true)
- `descripcion` (string, requerido): Descripción del ítem (máx. 300 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Ítem creado exitosamente",
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas"
    }
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes, inválidos, o categoría inactiva
- `403`: Sin permisos
- `404`: Categoría no existe
- `409`: Ya existe un ítem con ese nombre en la categoría
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35.00,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados"
  }'
```

---

#### 📋 Listar Ítems del Menú

**Endpoint:** `GET /api/items`

**Descripción:** Obtiene todos los ítems del menú.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `categoriaId` (string): Filtrar por categoría específica
- `disponibilidad` (boolean): Filtrar por disponibilidad (`true` o `false`)
- `activo` (boolean): Filtrar por estado activo (`true` o `false`)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "item789xyz",
      "nombre": "Café Americano",
      "categoriaId": "cat123abc",
      "precio": 35,
      "disponibilidad": true,
      "descripcion": "Café americano preparado con granos seleccionados",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "activo": true,
      "categoria": {
        "id": "cat123abc",
        "nombre": "Bebidas"
      }
    }
  ],
  "total": 1
}
```

**Ejemplo con cURL:**
```bash
# Todos los ítems
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer {token}"

# Solo ítems disponibles de una categoría
curl -X GET "http://localhost:3000/api/items?categoriaId=cat123abc&disponibilidad=true" \
  -H "Authorization: Bearer {token}"
```

---

#### 🔍 Obtener Ítem por ID

**Endpoint:** `GET /api/items/:id`

**Descripción:** Obtiene los detalles de un ítem específico.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano",
    "categoriaId": "cat123abc",
    "precio": 35,
    "disponibilidad": true,
    "descripcion": "Café americano preparado con granos seleccionados",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas",
      "descripcion": "Bebidas frías y calientes"
    }
  }
}
```

**Errores posibles:**
- `404`: Ítem no encontrado

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/items/item789xyz \
  -H "Authorization: Bearer {token}"
```

---

#### ✏️ Actualizar Ítem

**Endpoint:** `PUT /api/items/:id`

**Descripción:** Actualiza un ítem existente del menú.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Café Americano Grande",
  "precio": 45.00,
  "disponibilidad": false,
  "descripcion": "Café americano grande preparado con granos premium"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Ítem actualizado exitosamente",
  "datos": {
    "id": "item789xyz",
    "nombre": "Café Americano Grande",
    "categoriaId": "cat123abc",
    "precio": 45,
    "disponibilidad": false,
    "descripcion": "Café americano grande preparado con granos premium",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:20:00.000Z",
    "activo": true,
    "categoria": {
      "id": "cat123abc",
      "nombre": "Bebidas"
    }
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos o categoría inactiva
- `403`: Sin permisos
- `404`: Ítem o categoría no encontrada

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/items/item789xyz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "precio": 45.00,
    "disponibilidad": false
  }'
```

---

#### 🗑️ Eliminar Ítem

**Endpoint:** `DELETE /api/items/:id`

**Descripción:** Elimina un ítem del menú (soft delete - marca como inactivo).

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Ítem eliminado exitosamente"
}
```

**Errores posibles:**
- `403`: Sin permisos
- `404`: Ítem no encontrado

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/items/item789xyz \
  -H "Authorization: Bearer {token}"
```

---

## Endpoints de Reservaciones

### 📅 Crear Reservación

**Endpoint:** `POST /api/reservaciones`

**Descripción:** Crea una nueva reservación en el sistema. Valida automáticamente conflictos de mesa en una ventana de 2 horas.

**Autenticación:** Requerida

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombreCliente": "María García",
  "telefono": "5551234567",
  "fecha": "2025-11-25",
  "hora": "19:30",
  "numeroPersonas": 4,
  "mesaAsignada": "Mesa 5",
  "notas": "Cliente prefiere área tranquila"
}
```

**Campos:**
- `nombreCliente` (string, requerido): Nombre del cliente (3-100 caracteres)
- `telefono` (string, requerido): Teléfono de contacto (mínimo 10 dígitos)
- `fecha` (string, requerido): Fecha de la reservación en formato YYYY-MM-DD
- `hora` (string, requerido): Hora de la reservación en formato HH:MM (24 horas)
- `numeroPersonas` (number, requerido): Cantidad de personas (1-20)
- `mesaAsignada` (string, requerido): Identificador de la mesa (3-50 caracteres)
- `notas` (string, opcional): Notas o comentarios adicionales (máx. 500 caracteres)

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Reservación creada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "pendiente",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes, inválidos, o conflicto de mesa
- `401`: Token no proporcionado o inválido
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/reservaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila"
  }'
```

---

### 📋 Listar Reservaciones

**Endpoint:** `GET /api/reservaciones`

**Descripción:** Obtiene todas las reservaciones con opciones de filtrado.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `fecha` (string): Filtrar por fecha específica (formato YYYY-MM-DD)
- `estado` (string): Filtrar por estado (`pendiente`, `confirmada`, `sentada`, `terminada`, `cancelada`)
- `mesaAsignada` (string): Filtrar por mesa asignada

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "res123abc",
      "nombreCliente": "María García",
      "telefono": "5551234567",
      "fecha": "2025-11-25",
      "hora": "19:30",
      "numeroPersonas": 4,
      "mesaAsignada": "Mesa 5",
      "notas": "Cliente prefiere área tranquila",
      "estado": "pendiente",
      "creadoEn": "2025-11-20T10:30:00.000Z",
      "actualizadoEn": "2025-11-20T10:30:00.000Z",
      "creadoPor": "abc123xyz"
    },
    {
      "id": "res456def",
      "nombreCliente": "Carlos López",
      "telefono": "5559876543",
      "fecha": "2025-11-25",
      "hora": "20:00",
      "numeroPersonas": 2,
      "mesaAsignada": "Mesa 3",
      "notas": "",
      "estado": "confirmada",
      "creadoEn": "2025-11-20T11:00:00.000Z",
      "actualizadoEn": "2025-11-20T14:30:00.000Z",
      "creadoPor": "abc123xyz"
    }
  ],
  "total": 2
}
```

**Ejemplo con cURL:**
```bash
# Todas las reservaciones
curl -X GET http://localhost:3000/api/reservaciones \
  -H "Authorization: Bearer {token}"

# Reservaciones de una fecha específica
curl -X GET "http://localhost:3000/api/reservaciones?fecha=2025-11-25" \
  -H "Authorization: Bearer {token}"

# Reservaciones pendientes de una mesa
curl -X GET "http://localhost:3000/api/reservaciones?estado=pendiente&mesaAsignada=Mesa%205" \
  -H "Authorization: Bearer {token}"
```

---

### 🔍 Obtener Reservación por ID

**Endpoint:** `GET /api/reservaciones/:id`

**Descripción:** Obtiene los detalles de una reservación específica.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "pendiente",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/reservaciones/res123abc \
  -H "Authorization: Bearer {token}"
```

---

### ✏️ Actualizar Reservación

**Endpoint:** `PUT /api/reservaciones/:id`

**Descripción:** Actualiza una reservación existente. No se pueden editar reservaciones terminadas o canceladas.

**Autenticación:** Requerida

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombreCliente": "María García Pérez",
  "telefono": "5551234568",
  "fecha": "2025-11-26",
  "hora": "20:00",
  "numeroPersonas": 5,
  "mesaAsignada": "Mesa 8",
  "notas": "Cliente prefiere área tranquila, celebración de cumpleaños",
  "estado": "confirmada"
}
```

**Campos actualizables:**
- `nombreCliente` (string): Nombre del cliente
- `telefono` (string): Teléfono (mínimo 10 dígitos)
- `fecha` (string): Fecha (YYYY-MM-DD)
- `hora` (string): Hora (HH:MM)
- `numeroPersonas` (number): Cantidad de personas (1-20)
- `mesaAsignada` (string): Mesa asignada
- `notas` (string): Notas adicionales
- `estado` (string): Estado de la reservación

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación actualizada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García Pérez",
    "telefono": "5551234568",
    "fecha": "2025-11-26",
    "hora": "20:00",
    "numeroPersonas": 5,
    "mesaAsignada": "Mesa 8",
    "notas": "Cliente prefiere área tranquila, celebración de cumpleaños",
    "estado": "confirmada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:45:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos, conflicto de mesa, o reservación terminada/cancelada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/reservaciones/res123abc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "numeroPersonas": 5,
    "estado": "confirmada"
  }'
```

---

### 🪑 Marcar Reservación como Sentada

**Endpoint:** `PATCH /api/reservaciones/:id/sentar`

**Descripción:** Marca una reservación como sentada cuando el cliente llega al restaurante. Solo permite cambiar de estado `pendiente` o `confirmada` a `sentada`.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación marcada como sentada",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "sentada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T19:32:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación no está en estado pendiente o confirmada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/sentar \
  -H "Authorization: Bearer {token}"
```

---

### ✅ Marcar Reservación como Terminada

**Endpoint:** `PATCH /api/reservaciones/:id/terminar`

**Descripción:** Marca una reservación como terminada cuando el cliente finaliza su visita. Solo permite cambiar de estado `sentada` a `terminada`.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación marcada como terminada",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "terminada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T21:15:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación no está en estado sentada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/terminar \
  -H "Authorization: Bearer {token}"
```

---

### ❌ Cancelar Reservación

**Endpoint:** `PATCH /api/reservaciones/:id/cancelar`

**Descripción:** Cancela una reservación. No se pueden cancelar reservaciones que ya están terminadas o canceladas.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Reservación cancelada exitosamente",
  "datos": {
    "id": "res123abc",
    "nombreCliente": "María García",
    "telefono": "5551234567",
    "fecha": "2025-11-25",
    "hora": "19:30",
    "numeroPersonas": 4,
    "mesaAsignada": "Mesa 5",
    "notas": "Cliente prefiere área tranquila",
    "estado": "cancelada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-25T18:00:00.000Z",
    "creadoPor": "abc123xyz"
  }
}
```

**Errores posibles:**
- `400`: La reservación ya está terminada o cancelada
- `404`: Reservación no encontrada

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/reservaciones/res123abc/cancelar \
  -H "Authorization: Bearer {token}"
```

---

### 📊 Estados de Reservación

Las reservaciones siguen un flujo de estados específico:

```
pendiente → confirmada → sentada → terminada
    ↓           ↓           ↓
         cancelada    cancelada
```

| Estado | Descripción | Transiciones Permitidas |
|--------|-------------|------------------------|
| `pendiente` | Reservación creada, esperando confirmación | → confirmada, sentada, cancelada |
| `confirmada` | Reservación confirmada por el cliente | → sentada, cancelada |
| `sentada` | Cliente ha llegado y está en la mesa | → terminada, cancelada |
| `terminada` | Cliente ha finalizado su visita | (estado final) |
| `cancelada` | Reservación cancelada | (estado final) |

**Reglas importantes:**
- Una reservación en estado `terminada` o `cancelada` no puede ser editada
- Solo las reservaciones en estado `sentada` pueden marcarse como terminadas
- Solo las reservaciones en estado `pendiente` o `confirmada` pueden marcarse como sentadas
- El sistema valida automáticamente conflictos de mesa (ventana de 2 horas)
- Los números de teléfono deben tener mínimo 10 dígitos
- El número de personas permitido es de 1 a 20

---

## Endpoints de Configuración

### ⚙️ Obtener Configuración

**Endpoint:** `GET /api/configuracion`

**Descripción:** Obtiene la configuración actual del restaurante. Si no existe, se crea automáticamente con valores por defecto.

**Autenticación:** Requerida

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z"
  }
}
```

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/configuracion \
  -H "Authorization: Bearer {token}"
```

---

### 🏪 Actualizar Información del Restaurante

**Endpoint:** `PUT /api/configuracion/restaurante`

**Descripción:** Actualiza la información básica del restaurante.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Mi Restaurante",
  "direccion": "Calle Principal 123",
  "telefono": "5551234567",
  "numeroMesas": 20
}
```

**Campos:**
- `nombre` (string, opcional): Nombre del restaurante (3-100 caracteres)
- `direccion` (string, opcional): Dirección del restaurante (10-200 caracteres)
- `telefono` (string, opcional): Teléfono de contacto (mínimo 10 dígitos)
- `numeroMesas` (number, opcional): Número total de mesas (0-500)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Información del restaurante actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T15:45:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Campos inválidos o fuera de rango
- `403`: Sin permisos (no es admin ni gerente)
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/restaurante \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Mi Restaurante",
    "direccion": "Calle Principal 123",
    "telefono": "5551234567",
    "numeroMesas": 20
  }'
```

---

### 🔔 Actualizar Configuración de Notificaciones

**Endpoint:** `PUT /api/configuracion/notificaciones`

**Descripción:** Activa o desactiva las notificaciones del sistema.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "nuevasOrdenes": true,
  "nuevasReservaciones": false
}
```

**Campos:**
- `nuevasOrdenes` (boolean, opcional): Recibir notificaciones de nuevas órdenes
- `nuevasReservaciones` (boolean, opcional): Recibir notificaciones de nuevas reservaciones

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Configuración de notificaciones actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": false
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:00:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Valores inválidos (deben ser booleanos)
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/notificaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nuevasOrdenes": true,
    "nuevasReservaciones": false
  }'
```

---

### 💰 Actualizar Configuración de Impuestos

**Endpoint:** `PUT /api/configuracion/impuestos`

**Descripción:** Configura el porcentaje de IVA que se aplicará a las órdenes.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "porcentajeIVA": 16,
  "aplicarATodos": true
}
```

**Campos:**
- `porcentajeIVA` (number, opcional): Porcentaje de IVA (0-100)
- `aplicarATodos` (boolean, opcional): Si se aplica el IVA a todas las órdenes

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Configuración de impuestos actualizada exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:15:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Porcentaje fuera de rango (0-100) o valores inválidos
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/impuestos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "porcentajeIVA": 16,
    "aplicarATodos": true
  }'
```

---

### 💵 Actualizar Opciones de Propina

**Endpoint:** `PUT /api/configuracion/propinas`

**Descripción:** Configura las opciones de propina sugeridas que se mostrarán al cliente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body (todos los campos son opcionales):**
```json
{
  "opcion1": 10,
  "opcion2": 15,
  "opcion3": 20,
  "permitirPersonalizada": true
}
```

**Campos:**
- `opcion1` (number, opcional): Primera opción de propina en porcentaje (0-100)
- `opcion2` (number, opcional): Segunda opción de propina en porcentaje (0-100)
- `opcion3` (number, opcional): Tercera opción de propina en porcentaje (0-100)
- `permitirPersonalizada` (boolean, opcional): Permitir que el cliente ingrese una propina personalizada

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Opciones de propina actualizadas exitosamente",
  "datos": {
    "restaurante": {
      "nombre": "Mi Restaurante",
      "direccion": "Calle Principal 123",
      "telefono": "5551234567",
      "numeroMesas": 20
    },
    "notificaciones": {
      "nuevasOrdenes": true,
      "nuevasReservaciones": true
    },
    "impuestos": {
      "porcentajeIVA": 16,
      "aplicarATodos": true
    },
    "propinas": {
      "opcion1": 10,
      "opcion2": 15,
      "opcion3": 20,
      "permitirPersonalizada": true
    },
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T16:30:00.000Z"
  }
}
```

**Errores posibles:**
- `400`: Porcentajes fuera de rango (0-100) o valores inválidos
- `403`: Sin permisos
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/configuracion/propinas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "opcion1": 10,
    "opcion2": 15,
    "opcion3": 20,
    "permitirPersonalizada": true
  }'
```

---

### 📊 Estructura de Configuración

La configuración del sistema se organiza en cuatro secciones principales:

**1. Información del Restaurante:**
- Datos básicos del establecimiento
- Nombre, dirección, teléfono y número de mesas

**2. Notificaciones:**
- Control de alertas del sistema
- Nuevas órdenes y nuevas reservaciones

**3. Impuestos:**
- Configuración de IVA
- Porcentaje aplicable y opciones de aplicación

**4. Propinas:**
- Opciones sugeridas para clientes
- Tres porcentajes predefinidos
- Opción para permitir propinas personalizadas

**Reglas importantes:**
- Solo usuarios con rol `admin` o `gerente` pueden modificar la configuración
- Todos los endpoints permiten actualizaciones parciales (solo enviar campos a modificar)
- Si no existe configuración al consultar, se crea automáticamente con valores por defecto
- Los cambios se reflejan inmediatamente en todo el sistema
- Solo existe un documento de configuración para todo el restaurante

---

## 🪑 Gestión de Mesas

### Inicialización de Mesas

Las mesas se crean automáticamente basándose en el número configurado en la configuración del restaurante. **No es necesario crear mesas individualmente**, el sistema las genera todas en un solo paso.

### 🔧 Inicializar Mesas

**Endpoint:** `POST /api/mesas/inicializar`

**Descripción:** Crea automáticamente todas las mesas según el `numeroMesas` configurado en `/api/configuracion/restaurante`. Las mesas se crean con valores predeterminados que luego pueden editarse individualmente.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Proceso de inicialización:**
1. Lee el `numeroMesas` de la configuración del restaurante
2. Verifica cuántas mesas activas ya existen
3. Crea las mesas faltantes con estos valores por defecto:
   - **Número:** "Mesa 1", "Mesa 2", "Mesa 3", etc.
   - **Capacidad:** 4 personas
   - **Sección:** "Sin asignar"
   - **Estado:** "libre"

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Se crearon 20 mesas exitosamente",
  "datos": {
    "mesasCreadas": 20,
    "totalMesas": 20,
    "mesas": [
      {
        "id": "uueVavsgIK79DybMLdW4",
        "numeroMesa": "Mesa 1",
        "capacidad": 4,
        "seccion": "Sin asignar",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      },
      {
        "id": "xyz789abc123def456",
        "numeroMesa": "Mesa 2",
        "capacidad": 4,
        "seccion": "Sin asignar",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:01.000Z",
        "actualizadoEn": "2025-11-20T10:30:01.000Z",
        "activo": true
      }
      // ... resto de las mesas
    ]
  }
}
```

**Si ya existen todas las mesas (400):**
```json
{
  "exito": false,
  "error": "Ya existen todas las mesas configuradas (20)"
}
```

**Errores posibles:**
- `400`: Ya existen todas las mesas o número de mesas es 0
- `403`: Sin permisos (no es admin ni gerente)
- `404`: No existe configuración del restaurante
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/mesas/inicializar \
  -H "Authorization: Bearer {token}"
```

**Notas importantes:** 
- ⚠️ **Primero debes configurar** el `numeroMesas` en `/api/configuracion/restaurante`
- Este endpoint solo crea mesas nuevas, **no elimina las existentes**
- Si ya tienes 10 mesas y configuras 20, solo creará las 10 faltantes
- Después de inicializar, edita cada mesa para asignar capacidad y sección específicas

---

### 📋 Listar Mesas

**Endpoint:** `GET /api/mesas`

**Descripción:** Obtiene la lista de todas las mesas activas del restaurante, con opción de filtrar por estado.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`
  - Si no se especifica, devuelve todas las mesas

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "mesas": [
      {
        "id": "uueVavsgIK79DybMLdW4",
        "numeroMesa": "Mesa 1",
        "capacidad": 4,
        "seccion": "Salon Principal",
        "estado": "libre",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      },
      {
        "id": "xyz789abc123def456",
        "numeroMesa": "Mesa 2",
        "capacidad": 6,
        "seccion": "Terraza",
        "estado": "ocupada",
        "creadoEn": "2025-11-20T10:35:00.000Z",
        "actualizadoEn": "2025-11-20T14:20:00.000Z",
        "activo": true
      }
    ],
    "total": 2
  }
}
```

**Ejemplos de filtrado:**

**Todas las mesas:**
```bash
curl -X GET http://localhost:3000/api/mesas \
  -H "Authorization: Bearer {token}"
```

**Solo mesas libres:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=libre" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas ocupadas:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=ocupada" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas reservadas:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=reservada" \
  -H "Authorization: Bearer {token}"
```

**Solo mesas en limpieza:**
```bash
curl -X GET "http://localhost:3000/api/mesas?estado=en_limpieza" \
  -H "Authorization: Bearer {token}"
```

**Errores posibles:**
- `400`: Estado inválido
- `401`: No autenticado
- `500`: Error del servidor

---

### 🔍 Obtener Mesa por ID

**Endpoint:** `GET /api/mesas/:id`

**Descripción:** Obtiene los detalles de una mesa específica.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 4,
    "seccion": "Salon Principal",
    "estado": "libre",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Mesa no encontrada
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Authorization: Bearer {token}"
```

---

### ✏️ Actualizar Mesa

**Endpoint:** `PUT /api/mesas/:id`

**Descripción:** Actualiza los datos de una mesa existente. Permite modificar capacidad, sección y estado.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Body (todos los campos son opcionales):**
```json
{
  "capacidad": 6,
  "seccion": "Terraza",
  "estado": "ocupada"
}
```

**Campos:**
- `capacidad` (number, opcional): Número de personas que puede acomodar (1-20)
- `seccion` (string, opcional): Sección donde se encuentra la mesa (3-100 caracteres)
- `estado` (string, opcional): Estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Mesa actualizada exitosamente",
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 6,
    "seccion": "Terraza",
    "estado": "ocupada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T14:20:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos
- `403`: Sin permisos (no es admin ni gerente)
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "capacidad": 6,
    "seccion": "Terraza",
    "estado": "ocupada"
  }'
```

---

### 🔄 Cambiar Estado de Mesa

**Endpoint:** `PATCH /api/mesas/:id/estado`

**Descripción:** Endpoint específico para cambiar solo el estado de una mesa de forma rápida. Útil para actualizar el estado sin enviar otros datos.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Body:**
```json
{
  "estado": "ocupada"
}
```

**Campos:**
- `estado` (string, requerido): Nuevo estado de la mesa
  - Valores: `libre`, `ocupada`, `reservada`, `en_limpieza`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Estado de la mesa actualizado exitosamente",
  "datos": {
    "id": "uueVavsgIK79DybMLdW4",
    "numeroMesa": "Mesa 1",
    "capacidad": 4,
    "seccion": "Salon Principal",
    "estado": "ocupada",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T14:25:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Estado inválido
- `401`: No autenticado
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplos con cURL:**

**Marcar mesa como ocupada:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "ocupada"}'
```

**Marcar mesa como libre:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "libre"}'
```

**Marcar mesa en limpieza:**
```bash
curl -X PATCH http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "en_limpieza"}'
```

---

### 🗑️ Eliminar Mesa

**Endpoint:** `DELETE /api/mesas/:id`

**Descripción:** Realiza una eliminación lógica de la mesa (marca como inactiva). La mesa no se elimina físicamente de la base de datos.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID de la mesa

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Mesa eliminada exitosamente"
}
```

**Errores posibles:**
- `403`: Sin permisos (no es admin ni gerente)
- `404`: Mesa no encontrada
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/mesas/uueVavsgIK79DybMLdW4 \
  -H "Authorization: Bearer {token}"
```

---

### 📊 Estados de Mesa

Las mesas pueden tener los siguientes estados:

| Estado | Descripción | Color sugerido |
|--------|-------------|----------------|
| `libre` | Mesa disponible para asignar | 🟢 Verde |
| `ocupada` | Mesa con clientes actualmente | 🔴 Rojo |
| `reservada` | Mesa reservada para una hora específica | 🟡 Amarillo |
| `en_limpieza` | Mesa en proceso de limpieza | 🔵 Azul |

### 🔄 Flujo de Trabajo Recomendado

1. **Configuración inicial:**
   - Configura el `numeroMesas` en `/api/configuracion/restaurante`
   - Ejecuta `POST /api/mesas/inicializar` para crear todas las mesas

2. **Personalización:**
   - Edita cada mesa con `PUT /api/mesas/:id` para asignar:
     - Capacidad específica (2, 4, 6, 8 personas, etc.)
     - Sección ("Terraza", "Salon Principal", "VIP", etc.)

3. **Operación diaria:**
   - Los meseros consultan mesas libres: `GET /api/mesas?estado=libre`
   - Al asignar clientes: `PATCH /api/mesas/:id/estado` → `ocupada`
   - Al terminar: `PATCH /api/mesas/:id/estado` → `en_limpieza`
   - Después de limpiar: `PATCH /api/mesas/:id/estado` → `libre`

4. **Gestión de reservaciones:**
   - Al confirmar reserva: `PATCH /api/mesas/:id/estado` → `reservada`
   - Al llegar el cliente: `PATCH /api/mesas/:id/estado` → `ocupada`

---

## 🍽️ Gestión de Pedidos

### Flujo de Pedidos

El sistema de pedidos permite a los meseros tomar pedidos de las mesas, agregar items del menú con observaciones específicas, y gestionar el estado del pedido desde su creación hasta su entrega.

### 📝 Crear Pedido

**Endpoint:** `POST /api/pedidos`

**Descripción:** Crea un nuevo pedido para una mesa específica. Al crear el pedido, la mesa cambia automáticamente su estado a "ocupada" si está libre.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "mesaId": "9clzrKWz1eKReUqHL4XP",
  "items": [
    {
      "itemId": "8nKgku3ZZb0LAy4rjGpV",
      "cantidad": 2,
      "observaciones": "Sin azúcar"
    },
    {
      "itemId": "xyz789abc123",
      "cantidad": 1,
      "observaciones": "Término medio"
    }
  ],
  "observaciones": "Cliente prefiere servicio rápido"
}
```

**Campos:**
- `mesaId` (string, requerido): ID de la mesa donde se realiza el pedido
- `items` (array, requerido): Lista de items del pedido (mínimo 1)
  - `itemId` (string, requerido): ID del item del menú
  - `cantidad` (number, requerido): Cantidad del item (mínimo 1)
  - `observaciones` (string, opcional): Observaciones específicas del item (máx. 200 caracteres)
- `observaciones` (string, opcional): Observaciones generales del pedido (máx. 500 caracteres)

**Proceso automático:**
1. Verifica que la mesa existe y está activa
2. Valida que todos los items existen y están disponibles
3. Calcula subtotal, impuestos y total automáticamente
4. Asigna el mesero que creó el pedido
5. Cambia el estado de la mesa a "ocupada" si está libre

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Pedido creado exitosamente",
  "datos": {
    "id": "pedido123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [
      {
        "itemId": "8nKgku3ZZb0LAy4rjGpV",
        "nombre": "Café Americano",
        "descripcion": "Café americano preparado con granos seleccionados",
        "categoria": "Bebidas",
        "precioUnitario": 35,
        "cantidad": 2,
        "observaciones": "Sin azúcar",
        "subtotal": 70
      }
    ],
    "observaciones": "Cliente prefiere servicio rápido",
    "subtotal": 70,
    "impuestos": 11.2,
    "total": 81.2,
    "estado": "pendiente",
    "meseroId": "9lKe5hLK5bHOMO59KGkc",
    "meseroNombre": "Juan Pérez",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Campos faltantes o inválidos, items no disponibles
- `404`: Mesa no encontrada o item no encontrado
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "items": [
      {
        "itemId": "8nKgku3ZZb0LAy4rjGpV",
        "cantidad": 2,
        "observaciones": "Sin azúcar"
      }
    ],
    "observaciones": "Cliente prefiere servicio rápido"
  }'
```

---

### 📋 Listar Pedidos

**Endpoint:** `GET /api/pedidos`

**Descripción:** Obtiene la lista de pedidos activos con opciones de filtrado por estado, mesa o fecha.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado del pedido
  - Valores: `pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`
- `mesaId`: Filtrar por ID de mesa específica
- `fecha`: Filtrar por fecha específica (formato: YYYY-MM-DD)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "pedidos": [
      {
        "id": "pedido123abc",
        "mesaId": "9clzrKWz1eKReUqHL4XP",
        "numeroMesa": "Mesa 11",
        "items": [...],
        "observaciones": "Cliente prefiere servicio rápido",
        "subtotal": 70,
        "impuestos": 11.2,
        "total": 81.2,
        "estado": "pendiente",
        "meseroId": "9lKe5hLK5bHOMO59KGkc",
        "meseroNombre": "Juan Pérez",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      }
    ],
    "total": 1
  }
}
```

**Ejemplos de filtrado:**

**Todos los pedidos:**
```bash
curl -X GET http://localhost:3000/api/pedidos \
  -H "Authorization: Bearer {token}"
```

**Solo pedidos pendientes:**
```bash
curl -X GET "http://localhost:3000/api/pedidos?estado=pendiente" \
  -H "Authorization: Bearer {token}"
```

**Pedidos de una mesa específica:**
```bash
curl -X GET "http://localhost:3000/api/pedidos?mesaId=9clzrKWz1eKReUqHL4XP" \
  -H "Authorization: Bearer {token}"
```

**Pedidos de una fecha específica:**
```bash
curl -X GET "http://localhost:3000/api/pedidos?fecha=2025-11-20" \
  -H "Authorization: Bearer {token}"
```

**Errores posibles:**
- `400`: Estado inválido
- `401`: No autenticado
- `500`: Error del servidor

---

### 🔍 Obtener Pedido por ID

**Endpoint:** `GET /api/pedidos/:id`

**Descripción:** Obtiene los detalles completos de un pedido específico.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "pedido123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "observaciones": "Cliente prefiere servicio rápido",
    "subtotal": 70,
    "impuestos": 11.2,
    "total": 81.2,
    "estado": "pendiente",
    "meseroId": "9lKe5hLK5bHOMO59KGkc",
    "meseroNombre": "Juan Pérez",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Pedido no encontrado
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/pedidos/pedido123abc \
  -H "Authorization: Bearer {token}"
```

---

### ✏️ Actualizar Pedido

**Endpoint:** `PUT /api/pedidos/:id`

**Descripción:** Actualiza los items o observaciones de un pedido. **Solo se pueden modificar pedidos en estado "pendiente"**.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Body (todos los campos son opcionales):**
```json
{
  "items": [
    {
      "itemId": "8nKgku3ZZb0LAy4rjGpV",
      "cantidad": 3,
      "observaciones": "Sin azúcar, con hielo"
    }
  ],
  "observaciones": "Cliente tiene prisa"
}
```

**Campos:**
- `items` (array, opcional): Nueva lista completa de items
- `observaciones` (string, opcional): Nuevas observaciones generales

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Pedido actualizado exitosamente",
  "datos": {
    "id": "pedido123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "observaciones": "Cliente tiene prisa",
    "subtotal": 105,
    "impuestos": 16.8,
    "total": 121.8,
    "estado": "pendiente",
    "meseroId": "9lKe5hLK5bHOMO59KGkc",
    "meseroNombre": "Juan Pérez",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:35:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos, pedido no está en estado pendiente
- `404`: Pedido no encontrado o item no encontrado
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PUT http://localhost:3000/api/pedidos/pedido123abc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "items": [
      {
        "itemId": "8nKgku3ZZb0LAy4rjGpV",
        "cantidad": 3,
        "observaciones": "Sin azúcar, con hielo"
      }
    ],
    "observaciones": "Cliente tiene prisa"
  }'
```

---

### 🔄 Cambiar Estado del Pedido

**Endpoint:** `PATCH /api/pedidos/:id/estado`

**Descripción:** Cambia el estado del pedido siguiendo el flujo de trabajo definido. Cuando un pedido se entrega o cancela, si no hay más pedidos activos en la mesa, ésta cambia automáticamente a "en_limpieza".

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Body:**
```json
{
  "estado": "en_preparacion"
}
```

**Campos:**
- `estado` (string, requerido): Nuevo estado del pedido
  - Valores: `pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`

**Transiciones válidas:**
- `pendiente` → `en_preparacion` o `cancelado`
- `en_preparacion` → `listo` o `cancelado`
- `listo` → `entregado` o `cancelado`
- `entregado` → (estado final, no se puede cambiar)
- `cancelado` → (estado final, no se puede cambiar)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Estado del pedido actualizado exitosamente",
  "datos": {
    "id": "pedido123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "observaciones": "Cliente prefiere servicio rápido",
    "subtotal": 70,
    "impuestos": 11.2,
    "total": 81.2,
    "estado": "en_preparacion",
    "meseroId": "9lKe5hLK5bHOMO59KGkc",
    "meseroNombre": "Juan Pérez",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:35:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Estado inválido o transición no permitida
- `404`: Pedido no encontrado
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplos con cURL:**

**Enviar a cocina:**
```bash
curl -X PATCH http://localhost:3000/api/pedidos/pedido123abc/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "en_preparacion"}'
```

**Marcar como listo:**
```bash
curl -X PATCH http://localhost:3000/api/pedidos/pedido123abc/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "listo"}'
```

**Entregar pedido:**
```bash
curl -X PATCH http://localhost:3000/api/pedidos/pedido123abc/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "entregado"}'
```

---

### ❌ Cancelar Pedido

**Endpoint:** `PATCH /api/pedidos/:id/cancelar`

**Descripción:** Cancela un pedido que no ha sido entregado. Si no hay más pedidos activos en la mesa, ésta cambia automáticamente a "libre".

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Pedido cancelado exitosamente"
}
```

**Errores posibles:**
- `400`: Pedido ya entregado o ya cancelado
- `404`: Pedido no encontrado
- `401`: No autenticado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/pedidos/pedido123abc/cancelar \
  -H "Authorization: Bearer {token}"
```

---

### 🗑️ Eliminar Pedido

**Endpoint:** `DELETE /api/pedidos/:id`

**Descripción:** Realiza una eliminación lógica del pedido (marca como inactivo). Solo admin y gerente pueden eliminar pedidos.

**Autenticación:** Requerida (admin o gerente)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Pedido eliminado exitosamente"
}
```

**Errores posibles:**
- `403`: Sin permisos (no es admin ni gerente)
- `404`: Pedido no encontrado
- `500`: Error del servidor

**Ejemplo con cURL:**
```bash
curl -X DELETE http://localhost:3000/api/pedidos/pedido123abc \
  -H "Authorization: Bearer {token}"
```

---

### 📊 Estados de Pedido

Los pedidos siguen un flujo de estados bien definido:

| Estado | Descripción | Color sugerido | Siguiente estado posible |
|--------|-------------|----------------|-------------------------|
| `pendiente` | Pedido creado, esperando envío a cocina | 🟡 Amarillo | en_preparacion, cancelado |
| `en_preparacion` | Pedido en cocina | 🟠 Naranja | listo, cancelado |
| `listo` | Pedido terminado, listo para servir | 🔵 Azul | entregado, cancelado |
| `entregado` | Pedido entregado al cliente | 🟢 Verde | (final) |
| `cancelado` | Pedido cancelado | 🔴 Rojo | (final) |

### 🔄 Flujo de Trabajo Recomendado para Pedidos

1. **Tomar pedido:**
   - Mesero selecciona mesa libre o reservada
   - Agrega items del menú con cantidades y observaciones
   - Agrega observaciones generales del pedido
   - Crea el pedido: `POST /api/pedidos`
   - La mesa cambia automáticamente a "ocupada"

2. **Enviar a cocina:**
   - Cambiar estado: `PATCH /api/pedidos/:id/estado` → `en_preparacion`
   - La cocina ve los pedidos con este estado

3. **Preparación:**
   - Cocina prepara los items
   - Al terminar: `PATCH /api/pedidos/:id/estado` → `listo`

4. **Servir:**
   - Mesero entrega el pedido
   - Cambiar estado: `PATCH /api/pedidos/:id/estado` → `entregado`
   - Si no hay más pedidos activos, la mesa cambia a "en_limpieza"

5. **Casos especiales:**
   - **Modificar pedido:** Solo mientras está `pendiente` con `PUT /api/pedidos/:id`
   - **Cancelar:** En cualquier momento antes de entregar con `PATCH /api/pedidos/:id/cancelar`

### 💡 Notas Importantes sobre Pedidos

- Los totales (subtotal, impuestos, total) se calculan automáticamente según los precios actuales de los items
- El porcentaje de impuestos se toma de la configuración del restaurante
- Solo se pueden modificar pedidos en estado "pendiente"
- Al crear un pedido, se valida que todos los items estén disponibles
- El sistema registra automáticamente quién tomó el pedido (meseroId y meseroNombre)
- Las mesas se gestionan automáticamente según el estado de los pedidos

---

## 👨‍🍳 Módulo de Cocina

El módulo de cocina permite al personal de cocina gestionar los pedidos desde su perspectiva, visualizando solo los pedidos relevantes y cambiando sus estados según el flujo de preparación.

### 📋 Listar Pedidos de Cocina

**Endpoint:** `GET /api/cocina/pedidos`

**Descripción:** Obtiene todos los pedidos activos para cocina, agrupados por estado (pendientes, en preparación, listos) con totales. Ordena los pedidos del más antiguo al más reciente.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado específico
  - Valores: `pendiente`, `en_preparacion`, `listo`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "pedidos": [
      {
        "id": "k1LVWvV0Nvoz7kY5bRcI",
        "mesaId": "9clzrKWz1eKReUqHL4XP",
        "numeroMesa": "Mesa 11",
        "items": [
          {
            "itemId": "8nKgku3ZZb0LAy4rjGpV",
            "nombre": "Café Americano",
            "descripcion": "Café americano preparado con granos seleccionados",
            "categoria": "Bebidas",
            "precioUnitario": 35,
            "cantidad": 2,
            "observaciones": "Sin azúcar",
            "subtotal": 70
          }
        ],
        "observaciones": "Cliente prefiere servicio rápido",
        "subtotal": 70,
        "impuestos": 11.2,
        "total": 81.2,
        "estado": "pendiente",
        "meseroId": "9lKe5hLK5bHOMO59KGkc",
        "meseroNombre": "Juan Pérez",
        "creadoEn": "2025-11-20T10:30:00.000Z",
        "actualizadoEn": "2025-11-20T10:30:00.000Z",
        "activo": true
      }
    ],
    "agrupados": {
      "pendientes": [...],
      "en_preparacion": [...],
      "listos": [...]
    },
    "totales": {
      "pendientes": 3,
      "en_preparacion": 2,
      "listos": 1,
      "total": 6
    }
  }
}
```

**Ejemplos de uso:**

**Todos los pedidos de cocina:**
```bash
curl -X GET http://localhost:3000/api/cocina/pedidos \
  -H "Authorization: Bearer {token}"
```

**Solo pedidos pendientes:**
```bash
curl -X GET "http://localhost:3000/api/cocina/pedidos?estado=pendiente" \
  -H "Authorization: Bearer {token}"
```

**Solo pedidos en preparación:**
```bash
curl -X GET "http://localhost:3000/api/cocina/pedidos?estado=en_preparacion" \
  -H "Authorization: Bearer {token}"
```

**Solo pedidos listos:**
```bash
curl -X GET "http://localhost:3000/api/cocina/pedidos?estado=listo" \
  -H "Authorization: Bearer {token}"
```

---

### 🔍 Obtener Detalle de Pedido (Cocina)

**Endpoint:** `GET /api/cocina/pedidos/:id`

**Descripción:** Obtiene los detalles completos de un pedido específico desde la vista de cocina.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "k1LVWvV0Nvoz7kY5bRcI",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [
      {
        "itemId": "8nKgku3ZZb0LAy4rjGpV",
        "nombre": "Café Americano",
        "descripcion": "Café americano preparado con granos seleccionados",
        "categoria": "Bebidas",
        "precioUnitario": 35,
        "cantidad": 2,
        "observaciones": "Sin azúcar",
        "subtotal": 70
      }
    ],
    "observaciones": "Cliente prefiere servicio rápido",
    "subtotal": 70,
    "impuestos": 11.2,
    "total": 81.2,
    "estado": "pendiente",
    "meseroId": "9lKe5hLK5bHOMO59KGkc",
    "meseroNombre": "Juan Pérez",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:30:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `404`: Pedido no encontrado o no está en estados de cocina
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/cocina/pedidos/k1LVWvV0Nvoz7kY5bRcI \
  -H "Authorization: Bearer {token}"
```

---

### ▶️ Iniciar Preparación de Pedido

**Endpoint:** `PATCH /api/cocina/pedidos/:id/iniciar`

**Descripción:** Cambia el estado del pedido de `pendiente` a `en_preparacion`. Se usa cuando la cocina comienza a preparar el pedido.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Pedido en preparación",
  "datos": {
    "id": "k1LVWvV0Nvoz7kY5bRcI",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "estado": "en_preparacion",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:35:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Pedido no está en estado pendiente
- `404`: Pedido no encontrado
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/cocina/pedidos/k1LVWvV0Nvoz7kY5bRcI/iniciar \
  -H "Authorization: Bearer {token}"
```

---

### ✅ Marcar Pedido como Listo

**Endpoint:** `PATCH /api/cocina/pedidos/:id/listo`

**Descripción:** Cambia el estado del pedido de `en_preparacion` a `listo`. Se usa cuando la cocina termina de preparar el pedido y está listo para servir.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Pedido listo para servir",
  "datos": {
    "id": "k1LVWvV0Nvoz7kY5bRcI",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "estado": "listo",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:40:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Pedido no está en estado en_preparacion
- `404`: Pedido no encontrado
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/cocina/pedidos/k1LVWvV0Nvoz7kY5bRcI/listo \
  -H "Authorization: Bearer {token}"
```

---

### 🔄 Cambiar Estado desde Cocina

**Endpoint:** `PATCH /api/cocina/pedidos/:id/estado`

**Descripción:** Cambia el estado del pedido a cualquier estado válido de cocina. Permite transiciones más flexibles que los endpoints específicos.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pedido

**Body:**
```json
{
  "estado": "en_preparacion"
}
```

**Campos:**
- `estado` (string, requerido): Nuevo estado del pedido
  - Valores permitidos: `pendiente`, `en_preparacion`, `listo`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Estado del pedido actualizado a: en_preparacion",
  "datos": {
    "id": "k1LVWvV0Nvoz7kY5bRcI",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "items": [...],
    "estado": "en_preparacion",
    "creadoEn": "2025-11-20T10:30:00.000Z",
    "actualizadoEn": "2025-11-20T10:35:00.000Z",
    "activo": true
  }
}
```

**Errores posibles:**
- `400`: Estado inválido (no es pendiente, en_preparacion o listo)
- `404`: Pedido no encontrado
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X PATCH http://localhost:3000/api/cocina/pedidos/k1LVWvV0Nvoz7kY5bRcI/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"estado": "en_preparacion"}'
```

---

### 📊 Estadísticas de Cocina

**Endpoint:** `GET /api/cocina/estadisticas`

**Descripción:** Obtiene estadísticas de los pedidos procesados por cocina, incluyendo totales por estado, tiempo promedio de preparación y los items más pedidos.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `fecha`: Filtrar estadísticas por fecha específica (formato: YYYY-MM-DD)
  - Si no se proporciona, muestra estadísticas del día actual

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "total_pedidos": 15,
    "pendientes": 3,
    "en_preparacion": 5,
    "listos": 2,
    "entregados": 4,
    "cancelados": 1,
    "tiempo_promedio_preparacion": 245,
    "items_mas_pedidos": [
      {
        "nombre": "Café Americano",
        "cantidad": 25
      },
      {
        "nombre": "Hamburguesa Clásica",
        "cantidad": 18
      },
      {
        "nombre": "Ensalada César",
        "cantidad": 12
      }
    ]
  }
}
```

**Campos de respuesta:**
- `total_pedidos`: Total de pedidos del período
- `pendientes`: Cantidad de pedidos pendientes
- `en_preparacion`: Cantidad de pedidos en preparación
- `listos`: Cantidad de pedidos listos
- `entregados`: Cantidad de pedidos entregados
- `cancelados`: Cantidad de pedidos cancelados
- `tiempo_promedio_preparacion`: Tiempo promedio en segundos desde que se inicia la preparación hasta que está listo
- `items_mas_pedidos`: Top 10 de items más pedidos con sus cantidades totales

**Ejemplos de uso:**

**Estadísticas del día actual:**
```bash
curl -X GET http://localhost:3000/api/cocina/estadisticas \
  -H "Authorization: Bearer {token}"
```

**Estadísticas de una fecha específica:**
```bash
curl -X GET "http://localhost:3000/api/cocina/estadisticas?fecha=2025-11-20" \
  -H "Authorization: Bearer {token}"
```

**Errores posibles:**
- `400`: Formato de fecha inválido
- `401`: No autenticado
- `500`: Error del servidor

---

### 🔄 Flujo de Trabajo en Cocina

El módulo de cocina sigue este flujo de trabajo optimizado:

```
MESERO ENVÍA → COCINA RECIBE → COCINA PREPARA → MESERO RECOGE → MESERO ENTREGA
    ↓              ↓                  ↓               ↓                ↓
pendiente → en_preparacion → listo → (mesero entrega) → entregado
```

**1. Recepción de pedidos (Estado: pendiente)**
- La cocina ve nuevos pedidos en la sección "Pendientes"
- Muestra: mesa, items, cantidades, observaciones
- Ordenados del más antiguo al más reciente
- Acción: Click en "Iniciar preparación" → `PATCH /api/cocina/pedidos/:id/iniciar`

**2. Preparación (Estado: en_preparacion)**
- Pedido aparece en sección "En Preparación"
- Cocineros preparan los items según observaciones
- Acción: Al terminar → `PATCH /api/cocina/pedidos/:id/listo`

**3. Listo para servir (Estado: listo)**
- Pedido aparece en sección "Listos"
- Mesero recoge el pedido
- Acción: Mesero entrega y marca como entregado desde módulo de pedidos

### 📱 Interfaz Sugerida para Cocina

**Vista principal con tres columnas:**

```
┌──────────────┬──────────────┬──────────────┐
│  PENDIENTES  │ PREPARACIÓN  │    LISTOS    │
│      3       │      5       │      2       │
├──────────────┼──────────────┼──────────────┤
│              │              │              │
│  Mesa 5      │  Mesa 2      │  Mesa 8      │
│  2 items     │  3 items     │  1 item      │
│  [INICIAR]   │  [MARCAR OK] │  🔔          │
│              │              │              │
│  Mesa 11     │  Mesa 7      │  Mesa 3      │
│  1 item      │  2 items     │  4 items     │
│  [INICIAR]   │  [MARCAR OK] │  🔔          │
└──────────────┴──────────────┴──────────────┘
```

### 💡 Características del Módulo de Cocina

✅ **Agrupación automática:** Los pedidos se agrupan por estado (pendientes, en_preparacion, listos)

✅ **Contadores en tiempo real:** Muestra totales de cada grupo para mejor visibilidad

✅ **Ordenamiento inteligente:** Los pedidos más antiguos aparecen primero

✅ **Vista simplificada:** Solo muestra estados relevantes para cocina (excluye entregado y cancelado de la vista principal)

✅ **Información completa:** Muestra mesa, items, cantidades, observaciones generales y observaciones por item

✅ **Transiciones validadas:** Solo permite cambios de estado válidos

✅ **Estadísticas útiles:** Tiempo promedio de preparación y items más pedidos

✅ **Filtrado flexible:** Puede filtrar por estado específico o ver todos los pedidos

### 🎯 Estados de Pedido en Cocina

| Estado | Descripción | Acción disponible |
|--------|-------------|-------------------|
| `pendiente` | Nuevo pedido recibido | Iniciar preparación |
| `en_preparacion` | Se está preparando | Marcar como listo |
| `listo` | Terminado, esperando mesero | (Mesero lo recoge) |

**Nota:** Los estados `entregado` y `cancelado` no se muestran en la vista principal de cocina, pero se incluyen en las estadísticas.

---

## 💳 Módulo de Pagos

El módulo de pagos permite procesar el cobro de las cuentas, con soporte para múltiples métodos de pago, propinas configurables y división de cuentas entre varias personas.

### 💰 Obtener Cuenta de Mesa

**Endpoint:** `GET /api/pagos/mesas/:mesaId/cuenta`

**Descripción:** Obtiene la cuenta completa de una mesa con todos sus pedidos activos, resumen de totales y opciones de propina sugeridas basadas en la configuración del restaurante.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `mesaId`: ID de la mesa

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "pedidos": [
      {
        "id": "pedido123abc",
        "mesaId": "9clzrKWz1eKReUqHL4XP",
        "numeroMesa": "Mesa 11",
        "items": [
          {
            "itemId": "8nKgku3ZZb0LAy4rjGpV",
            "nombre": "Café Americano",
            "precioUnitario": 35,
            "cantidad": 2,
            "observaciones": "Sin azúcar",
            "subtotal": 70
          }
        ],
        "observaciones": "Cliente prefiere servicio rápido",
        "subtotal": 70,
        "impuestos": 11.2,
        "total": 81.2,
        "estado": "listo"
      }
    ],
    "resumen": {
      "subtotal": 175,
      "impuestos": 28,
      "totalSinPropina": 203
    },
    "propinas": {
      "opcion1": {
        "porcentaje": 10,
        "monto": 17.5,
        "totalConPropina": 220.5
      },
      "opcion2": {
        "porcentaje": 15,
        "monto": 26.25,
        "totalConPropina": 229.25
      },
      "opcion3": {
        "porcentaje": 20,
        "monto": 35,
        "totalConPropina": 238
      },
      "permitirPersonalizada": true
    }
  }
}
```

**Errores posibles:**
- `404`: Mesa no encontrada o sin pedidos activos
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/pagos/mesas/9clzrKWz1eKReUqHL4XP/cuenta \
  -H "Authorization: Bearer {token}"
```

---

### ✂️ Dividir Cuenta

**Endpoint:** `POST /api/pagos/dividir-cuenta`

**Descripción:** Divide la cuenta de una mesa entre varias personas, asignando items específicos a cada división. Calcula automáticamente subtotal, impuestos y total para cada persona.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "mesaId": "9clzrKWz1eKReUqHL4XP",
  "numeroDivisiones": 2,
  "divisiones": [
    {
      "items": [
        {
          "itemId": "8nKgku3ZZb0LAy4rjGpV",
          "pedidoId": "pedido123abc",
          "subtotal": 105
        }
      ]
    },
    {
      "items": [
        {
          "itemId": "item456def",
          "pedidoId": "pedido789xyz",
          "subtotal": 70
        }
      ]
    }
  ]
}
```

**Campos:**
- `mesaId` (string, requerido): ID de la mesa
- `numeroDivisiones` (number, requerido): Número de personas (2-20)
- `divisiones` (array, requerido): Array con las divisiones
  - `items` (array, requerido): Items asignados a esta persona
    - `itemId` (string): ID del item
    - `pedidoId` (string): ID del pedido al que pertenece
    - `subtotal` (number): Subtotal del item

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Cuenta dividida exitosamente",
  "datos": {
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "pedidoIds": ["pedido123abc", "pedido789xyz"],
    "cuentaDividida": true,
    "numeroDivisiones": 2,
    "divisiones": [
      {
        "numero": 1,
        "items": [...],
        "subtotal": 105,
        "impuestos": 16.8,
        "total": 121.8,
        "propina": 0,
        "totalConPropina": 121.8
      },
      {
        "numero": 2,
        "items": [...],
        "subtotal": 70,
        "impuestos": 11.2,
        "total": 81.2,
        "propina": 0,
        "totalConPropina": 81.2
      }
    ],
    "totales": {
      "subtotal": 175,
      "impuestos": 28,
      "total": 203
    }
  }
}
```

**Errores posibles:**
- `400`: Datos inválidos, número de divisiones fuera de rango
- `404`: Mesa no encontrada o sin pedidos
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/pagos/dividir-cuenta \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroDivisiones": 2,
    "divisiones": [
      {
        "items": [{"itemId": "8nKgku3ZZb0LAy4rjGpV", "pedidoId": "pedido123abc", "subtotal": 105}]
      },
      {
        "items": [{"itemId": "item456def", "pedidoId": "pedido789xyz", "subtotal": 70}]
      }
    ]
  }'
```

---

### 💵 Procesar Pago

**Endpoint:** `POST /api/pagos/procesar`

**Descripción:** Procesa el pago de una mesa. Actualiza automáticamente los pedidos a "entregado", cambia la mesa a "en_limpieza" y registra el pago en el historial.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "mesaId": "9clzrKWz1eKReUqHL4XP",
  "metodoPago": "tarjeta",
  "porcentajePropina": 15,
  "cuentaDividida": false
}
```

**Campos:**
- `mesaId` (string, requerido): ID de la mesa
- `metodoPago` (string, requerido): Método de pago
  - Valores: `efectivo`, `transferencia`, `tarjeta`
- `propina` (number, opcional): Monto de propina personalizada
- `propinaPersonalizada` (boolean, opcional): Si la propina es personalizada
- `porcentajePropina` (number, opcional): Porcentaje de propina (10, 15, 20, etc.)
- `cuentaDividida` (boolean, opcional): Si la cuenta está dividida
- `numeroDivisiones` (number, opcional): Número de divisiones si aplica
- `divisiones` (array, opcional): Detalles de las divisiones

**Nota sobre propinas:**
- Puede enviar `propina` (monto) o `porcentajePropina` (porcentaje)
- Si envía monto, se calcula el porcentaje automáticamente
- Si envía porcentaje, se calcula el monto automáticamente
- Si no envía ninguno, la propina será 0

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Pago procesado exitosamente",
  "datos": {
    "id": "pago123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "pedidoIds": ["pedido123abc", "pedido789xyz"],
    "metodoPago": "tarjeta",
    "subtotal": 175,
    "impuestos": 28,
    "propina": 26.25,
    "propinaPersonalizada": false,
    "porcentajePropina": 15,
    "total": 229.25,
    "cuentaDividida": false,
    "numeroDivisiones": 1,
    "divisiones": [],
    "estado": "pagado",
    "pagoCompletado": true,
    "cajeroId": "cajero123",
    "cajeroNombre": "cajero@restaurante.com",
    "creadoEn": "2025-11-21T08:00:00.000Z",
    "actualizadoEn": "2025-11-21T08:00:00.000Z"
  }
}
```

**Cambios automáticos al procesar pago:**
1. ✅ Todos los pedidos de la mesa cambian a estado `entregado`
2. ✅ La mesa cambia a estado `en_limpieza`
3. ✅ Se registra el pago en el historial
4. ✅ Se guarda quién procesó el pago (cajeroId, cajeroNombre)

**Errores posibles:**
- `400`: Método de pago inválido
- `404`: Mesa no encontrada o sin pedidos
- `401`: No autenticado

**Ejemplos con cURL:**

**Pago con tarjeta y 15% de propina:**
```bash
curl -X POST http://localhost:3000/api/pagos/procesar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "metodoPago": "tarjeta",
    "porcentajePropina": 15
  }'
```

**Pago en efectivo con propina personalizada:**
```bash
curl -X POST http://localhost:3000/api/pagos/procesar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "metodoPago": "efectivo",
    "propina": 50,
    "propinaPersonalizada": true
  }'
```

**Pago con cuenta dividida:**
```bash
curl -X POST http://localhost:3000/api/pagos/procesar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "metodoPago": "tarjeta",
    "porcentajePropina": 15,
    "cuentaDividida": true,
    "numeroDivisiones": 2,
    "divisiones": [
      {
        "numero": 1,
        "items": [...],
        "subtotal": 105,
        "impuestos": 16.8,
        "total": 121.8
      },
      {
        "numero": 2,
        "items": [...],
        "subtotal": 70,
        "impuestos": 11.2,
        "total": 81.2
      }
    ]
  }'
```

---

### 📋 Listar Pagos

**Endpoint:** `GET /api/pagos`

**Descripción:** Obtiene el historial de pagos con filtros opcionales. Incluye totales de ventas y propinas.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (opcionales):**
- `fecha`: Filtrar por fecha específica (formato: YYYY-MM-DD)
- `metodoPago`: Filtrar por método de pago (`efectivo`, `transferencia`, `tarjeta`)
- `mesaId`: Filtrar por mesa específica

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "pagos": [
      {
        "id": "pago123abc",
        "mesaId": "9clzrKWz1eKReUqHL4XP",
        "numeroMesa": "Mesa 11",
        "pedidoIds": ["pedido123abc"],
        "metodoPago": "tarjeta",
        "subtotal": 175,
        "impuestos": 28,
        "propina": 26.25,
        "total": 229.25,
        "cuentaDividida": false,
        "estado": "pagado",
        "cajeroNombre": "cajero@restaurante.com",
        "creadoEn": "2025-11-21T08:00:00.000Z"
      }
    ],
    "total": 1,
    "totales": {
      "totalVentas": 229.25,
      "totalPropinas": 26.25
    }
  }
}
```

**Ejemplos de filtrado:**

**Todos los pagos:**
```bash
curl -X GET http://localhost:3000/api/pagos \
  -H "Authorization: Bearer {token}"
```

**Pagos de una fecha específica:**
```bash
curl -X GET "http://localhost:3000/api/pagos?fecha=2025-11-21" \
  -H "Authorization: Bearer {token}"
```

**Pagos con tarjeta:**
```bash
curl -X GET "http://localhost:3000/api/pagos?metodoPago=tarjeta" \
  -H "Authorization: Bearer {token}"
```

**Pagos de una mesa:**
```bash
curl -X GET "http://localhost:3000/api/pagos?mesaId=9clzrKWz1eKReUqHL4XP" \
  -H "Authorization: Bearer {token}"
```

---

### 🔍 Obtener Detalle de Pago

**Endpoint:** `GET /api/pagos/:id`

**Descripción:** Obtiene los detalles completos de un pago específico.

**Autenticación:** Requerida (cualquier rol autenticado)

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros de ruta:**
- `id`: ID del pago

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "pago123abc",
    "mesaId": "9clzrKWz1eKReUqHL4XP",
    "numeroMesa": "Mesa 11",
    "pedidoIds": ["pedido123abc", "pedido789xyz"],
    "metodoPago": "tarjeta",
    "subtotal": 175,
    "impuestos": 28,
    "propina": 26.25,
    "propinaPersonalizada": false,
    "porcentajePropina": 15,
    "total": 229.25,
    "cuentaDividida": true,
    "numeroDivisiones": 2,
    "divisiones": [...],
    "estado": "pagado",
    "pagoCompletado": true,
    "cajeroId": "cajero123",
    "cajeroNombre": "cajero@restaurante.com",
    "creadoEn": "2025-11-21T08:00:00.000Z",
    "actualizadoEn": "2025-11-21T08:00:00.000Z"
  }
}
```

**Errores posibles:**
- `404`: Pago no encontrado
- `401`: No autenticado

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/pagos/pago123abc \
  -H "Authorization: Bearer {token}"
```

---

### 💡 Flujo de Trabajo de Pagos

El módulo de pagos sigue este flujo completo:

```
SELECCIONAR MESA → VER CUENTA → (OPCIONAL) DIVIDIR CUENTA → PROCESAR PAGO
       ↓               ↓                    ↓                      ↓
  Mesa con      Ver pedidos +      Asignar items        Elegir método +
   pedidos       propinas           a cada persona          propina
   activos      sugeridas                                      ↓
                                                         Mesa a limpieza
                                                         Pedidos entregados
```

**1. Obtener cuenta de la mesa:**
- Endpoint: `GET /api/pagos/mesas/:mesaId/cuenta`
- Muestra todos los pedidos activos
- Calcula totales (subtotal, impuestos)
- Sugiere 3 opciones de propina basadas en configuración
- Permite propina personalizada si está habilitada

**2. (Opcional) Dividir cuenta:**
- Endpoint: `POST /api/pagos/dividir-cuenta`
- Especifica cuántas personas (2-20)
- Asigna items específicos a cada persona
- Calcula automáticamente:
  - Subtotal por persona
  - Impuestos proporcionales
  - Total individual
- Se puede cobrar por separado pero se registra como un solo pago

**3. Procesar pago:**
- Endpoint: `POST /api/pagos/procesar`
- Selecciona método de pago (efectivo, transferencia, tarjeta)
- Elige o ingresa propina:
  - Por porcentaje (10%, 15%, 20%)
  - Monto personalizado
  - Sin propina
- Si la cuenta está dividida, envía los detalles de división
- **Acciones automáticas al pagar:**
  - ✅ Cambia todos los pedidos a "entregado"
  - ✅ Cambia la mesa a "en_limpieza"
  - ✅ Registra el pago en historial
  - ✅ Guarda quién procesó el pago

**4. Historial y reportes:**
- Endpoint: `GET /api/pagos`
- Consulta pagos por fecha, método, mesa
- Ve totales de ventas y propinas
- Detalle completo de cada transacción

### 📊 Métodos de Pago Disponibles

| Método | Descripción | Uso |
|--------|-------------|-----|
| `efectivo` | Pago en efectivo | Cliente paga con billetes/monedas |
| `transferencia` | Transferencia bancaria | Cliente transfiere desde su banco |
| `tarjeta` | Tarjeta de crédito/débito | Terminal punto de venta |

### 💵 Gestión de Propinas

El sistema soporta tres formas de manejar propinas:

**1. Propinas sugeridas (por porcentaje):**
- Configurables en `/api/configuracion/propinas`
- Opciones por defecto: 10%, 15%, 20%
- Se calculan sobre el subtotal antes de impuestos
- Ejemplo: Subtotal $175 × 15% = $26.25

**2. Propina personalizada (por monto):**
- Cliente ingresa monto específico
- Se calcula el porcentaje automáticamente
- Debe estar habilitado en configuración
- Ejemplo: Cliente da $50 de propina

**3. Sin propina:**
- Simplemente no enviar campos de propina
- `propina: 0` y `porcentajePropina: 0`

### ✂️ División de Cuentas

**Características:**
- ✅ División entre 2 a 20 personas
- ✅ Asignación exacta de items a cada persona
- ✅ Cálculo automático de impuestos proporcionales
- ✅ Total individual por persona
- ✅ Suma total al final para verificación
- ✅ Se registra como un solo pago unificado

**Ejemplo de uso:**
Mesa con 2 pedidos, 2 personas:
- **Persona 1:** Café $105 → Total: $121.80 (con impuestos)
- **Persona 2:** Café $70 → Total: $81.20 (con impuestos)
- **Gran Total:** $203.00

Cada persona puede pagar su parte, pero el sistema registra un solo pago total de $203.00 más propina.

### 🎯 Casos de Uso Comunes

**Caso 1: Pago simple sin propina**
```json
{
  "mesaId": "mesa123",
  "metodoPago": "efectivo"
}
```

**Caso 2: Pago con propina del 15%**
```json
{
  "mesaId": "mesa123",
  "metodoPago": "tarjeta",
  "porcentajePropina": 15
}
```

**Caso 3: Pago con propina personalizada**
```json
{
  "mesaId": "mesa123",
  "metodoPago": "efectivo",
  "propina": 50,
  "propinaPersonalizada": true
}
```

**Caso 4: Cuenta dividida en 2 personas**
```json
{
  "mesaId": "mesa123",
  "metodoPago": "tarjeta",
  "porcentajePropina": 15,
  "cuentaDividida": true,
  "numeroDivisiones": 2,
  "divisiones": [
    {
      "numero": 1,
      "items": [...],
      "subtotal": 105,
      "impuestos": 16.8,
      "total": 121.8
    },
    {
      "numero": 2,
      "items": [...],
      "subtotal": 70,
      "impuestos": 11.2,
      "total": 81.2
    }
  ]
}
```

### 💡 Notas Importantes sobre Pagos

- Los totales incluyen automáticamente impuestos configurados en el sistema (default: 16%)
- Las propinas se calculan sobre el **subtotal** (antes de impuestos)
- Al procesar un pago, **todos** los pedidos activos de la mesa se marcan como entregados
- La mesa cambia automáticamente a "en_limpieza" después del pago
- Se registra quién procesó el pago (usuario autenticado)
- Las cuentas divididas se registran como un solo pago con detalles de división
- Los porcentajes de propina configurables se obtienen de `/api/configuracion`
- El historial de pagos se puede filtrar por fecha, método o mesa para reportes

---

## Módulo: Dashboard y Estadísticas

Este módulo proporciona métricas en tiempo real y estadísticas del sistema, diseñado para ofrecer una visión completa del rendimiento del restaurante. Incluye todas las métricas necesarias para el panel de control principal.

### Características del Dashboard

- 📊 **Métricas Principales**: Ingresos totales, órdenes completadas, ticket promedio, reservaciones
- 📈 **Análisis de Ventas**: Ventas por categoría con gráficos y porcentajes
- 🏆 **Productos Más Vendidos**: Top 5 productos con cantidades y totales
- 🕐 **Órdenes Recientes**: Historial en tiempo real de las últimas órdenes
- 📉 **Comparativas**: Porcentaje de cambio respecto al mes anterior
- 🔍 **Filtros por Fecha**: Consultar métricas de cualquier período

### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos Requeridos |
|--------|----------|-------------|---------------------|
| GET | `/api/dashboard/resumen` | Resumen completo con todas las métricas | `ver_reportes` o `ver_todo` |
| GET | `/api/dashboard/metricas` | Métricas principales del dashboard | `ver_reportes` o `ver_todo` |
| GET | `/api/dashboard/ventas-por-categoria` | Ventas agrupadas por categoría | `ver_reportes` o `ver_todo` |
| GET | `/api/dashboard/productos-mas-vendidos` | Top productos más vendidos | `ver_reportes` o `ver_todo` |
| GET | `/api/dashboard/ordenes-recientes` | Órdenes más recientes | `ver_reportes` o `ver_todo` |
| GET | `/api/dashboard/items-menu` | Total de items activos en el menú | `ver_reportes` o `ver_todo` |

---

### Obtener Resumen Completo del Dashboard

Endpoint principal que retorna todas las métricas, ventas por categoría, productos más vendidos y órdenes recientes en una sola petición.

```bash
# Resumen del día actual
curl -X GET http://localhost:3000/api/dashboard/resumen \
  -H "Authorization: Bearer <TOKEN>"

# Resumen de un período específico
curl -X GET "http://localhost:3000/api/dashboard/resumen?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "metricas": {
    "ingresosTotales": 15250.50,
    "porcentajeCambioIngresos": 12.5,
    "totalOrdenes": 85,
    "ordenesCompletadas": 85,
    "ticketPromedio": 179.42,
    "reservaciones": 12,
    "ordenesPendientes": 3,
    "ordenesEnPreparacion": 5,
    "propinaPromedio": 25.50,
    "propinaPorcentaje": 14.2,
    "periodo": {
      "inicio": "2024-01-01T00:00:00.000Z",
      "fin": "2024-01-31T23:59:59.999Z"
    },
    "itemsEnMenu": 45
  },
  "ventasPorCategoria": [
    {
      "categoria": "Platos Principales",
      "total": 8500.00,
      "cantidad": 120,
      "porcentaje": 55.74
    },
    {
      "categoria": "Bebidas",
      "total": 3200.00,
      "cantidad": 200,
      "porcentaje": 20.98
    }
  ],
  "productosMasVendidos": [
    {
      "itemId": "item123",
      "nombre": "Hamburguesa Clásica",
      "categoria": "Platos Principales",
      "cantidadVendida": 45,
      "totalVentas": 4500.00
    },
    {
      "itemId": "item456",
      "nombre": "Pizza Margherita",
      "categoria": "Platos Principales",
      "cantidadVendida": 38,
      "totalVentas": 3800.00
    }
  ],
  "ordenesRecientes": [
    {
      "id": "orden123",
      "mesaId": "mesa1",
      "mesaNumero": 5,
      "estado": "completado",
      "total": 250.00,
      "totalItems": 3,
      "creadoEn": "2024-01-31T20:15:00.000Z"
    }
  ]
}
```

---

### Obtener Métricas Principales

Retorna las métricas principales del dashboard: ingresos, órdenes, ticket promedio, etc.

```bash
# Métricas del día actual
curl -X GET http://localhost:3000/api/dashboard/metricas \
  -H "Authorization: Bearer <TOKEN>"

# Métricas de un período específico
curl -X GET "http://localhost:3000/api/dashboard/metricas?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"
```

**Parámetros de consulta**:
- `fechaInicio` (opcional): Fecha inicial en formato ISO 8601
- `fechaFin` (opcional): Fecha final en formato ISO 8601

**Respuesta exitosa** (200):
```json
{
  "metricas": {
    "ingresosTotales": 15250.50,
    "porcentajeCambioIngresos": 12.5,
    "totalOrdenes": 85,
    "ordenesCompletadas": 85,
    "ticketPromedio": 179.42,
    "reservaciones": 12,
    "ordenesPendientes": 3,
    "ordenesEnPreparacion": 5,
    "propinaPromedio": 25.50,
    "propinaPorcentaje": 14.2,
    "periodo": {
      "inicio": "2024-01-01T00:00:00.000Z",
      "fin": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

**Descripción de las métricas**:
- `ingresosTotales`: Suma total de pagos completados en el período
- `porcentajeCambioIngresos`: Variación porcentual respecto al mes anterior
- `totalOrdenes`: Total de órdenes completadas
- `ticketPromedio`: Promedio de venta por orden
- `reservaciones`: Total de reservaciones confirmadas
- `ordenesPendientes`: Órdenes en estado pendiente
- `ordenesEnPreparacion`: Órdenes en estado en_preparacion
- `propinaPromedio`: Promedio de propina por orden
- `propinaPorcentaje`: Propina como porcentaje de los ingresos totales

---

### Obtener Ventas por Categoría

Retorna las ventas agrupadas por categoría de productos, con totales, cantidades y porcentajes.

```bash
# Ventas por categoría del día actual
curl -X GET http://localhost:3000/api/dashboard/ventas-por-categoria \
  -H "Authorization: Bearer <TOKEN>"

# Ventas por categoría de un período
curl -X GET "http://localhost:3000/api/dashboard/ventas-por-categoria?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "ventasPorCategoria": [
    {
      "categoria": "Platos Principales",
      "total": 8500.00,
      "cantidad": 120,
      "porcentaje": 55.74
    },
    {
      "categoria": "Bebidas",
      "total": 3200.00,
      "cantidad": 200,
      "porcentaje": 20.98
    },
    {
      "categoria": "Entradas",
      "total": 2100.00,
      "cantidad": 85,
      "porcentaje": 13.77
    },
    {
      "categoria": "Postres",
      "total": 1450.50,
      "cantidad": 60,
      "porcentaje": 9.51
    }
  ],
  "total": 4
}
```

**Nota**: Los resultados están ordenados por total de ventas (descendente).

---

### Obtener Productos Más Vendidos

Retorna el top de productos con mejor desempeño en ventas.

```bash
# Top 5 productos del día
curl -X GET http://localhost:3000/api/dashboard/productos-mas-vendidos \
  -H "Authorization: Bearer <TOKEN>"

# Top 10 productos de un período
curl -X GET "http://localhost:3000/api/dashboard/productos-mas-vendidos?limite=10&fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"
```

**Parámetros de consulta**:
- `limite` (opcional): Cantidad de productos a retornar (1-50, default: 5)
- `fechaInicio` (opcional): Fecha inicial en formato ISO 8601
- `fechaFin` (opcional): Fecha final en formato ISO 8601

**Respuesta exitosa** (200):
```json
{
  "productosMasVendidos": [
    {
      "itemId": "item123",
      "nombre": "Hamburguesa Clásica",
      "categoria": "Platos Principales",
      "cantidadVendida": 45,
      "totalVentas": 4500.00
    },
    {
      "itemId": "item456",
      "nombre": "Pizza Margherita",
      "categoria": "Platos Principales",
      "cantidadVendida": 38,
      "totalVentas": 3800.00
    },
    {
      "itemId": "item789",
      "nombre": "Ensalada César",
      "categoria": "Entradas",
      "cantidadVendida": 32,
      "totalVentas": 1600.00
    }
  ],
  "total": 3
}
```

---

### Obtener Órdenes Recientes

Retorna las órdenes más recientes del sistema.

```bash
# Últimas 10 órdenes
curl -X GET http://localhost:3000/api/dashboard/ordenes-recientes \
  -H "Authorization: Bearer <TOKEN>"

# Últimas 20 órdenes
curl -X GET "http://localhost:3000/api/dashboard/ordenes-recientes?limite=20" \
  -H "Authorization: Bearer <TOKEN>"
```

**Parámetros de consulta**:
- `limite` (opcional): Cantidad de órdenes a retornar (1-50, default: 10)

**Respuesta exitosa** (200):
```json
{
  "ordenesRecientes": [
    {
      "id": "orden123",
      "mesaId": "mesa1",
      "mesaNumero": 5,
      "estado": "completado",
      "total": 250.00,
      "totalItems": 3,
      "items": [
        {
          "itemId": "item1",
          "nombre": "Hamburguesa",
          "cantidad": 2,
          "precio": 100.00
        }
      ],
      "creadoEn": "2024-01-31T20:15:00.000Z",
      "actualizadoEn": "2024-01-31T20:45:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Obtener Total de Items en el Menú

Retorna la cantidad de items activos en el menú.

```bash
curl -X GET http://localhost:3000/api/dashboard/items-menu \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "itemsEnMenu": 45
}
```

---

### Casos de Uso del Dashboard

#### 1. Vista Principal del Dashboard (como la imagen)

```javascript
// Frontend: Obtener resumen completo al cargar el dashboard
const cargarDashboard = async () => {
  const response = await fetch('/api/dashboard/resumen', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  // Renderizar métricas principales
  mostrarIngresosTotales(data.metricas.ingresosTotales);
  mostrarTotalOrdenes(data.metricas.totalOrdenes);
  mostrarTicketPromedio(data.metricas.ticketPromedio);
  mostrarReservaciones(data.metricas.reservaciones);
  
  // Renderizar gráficos
  renderizarGraficoVentasPorCategoria(data.ventasPorCategoria);
  renderizarTopProductos(data.productosMasVendidos);
  renderizarOrdenesRecientes(data.ordenesRecientes);
};
```

#### 2. Filtrar Dashboard por Período

```bash
# Estadísticas del mes actual
curl -X GET "http://localhost:3000/api/dashboard/resumen?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"

# Estadísticas de la semana pasada
curl -X GET "http://localhost:3000/api/dashboard/resumen?fechaInicio=2024-01-15T00:00:00.000Z&fechaFin=2024-01-21T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"
```

#### 3. Actualizar Dashboard en Tiempo Real

```javascript
// Actualizar métricas cada 30 segundos
setInterval(async () => {
  const response = await fetch('/api/dashboard/metricas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { metricas } = await response.json();
  actualizarMetricas(metricas);
}, 30000);
```

---

### Requisitos de Firestore

Para que el módulo de dashboard funcione correctamente, necesitas crear los siguientes **índices compuestos** en Firestore:

#### Índices Requeridos:

1. **Colección: `ordenes`**
   - Campos: `estado` (Ascending) + `creadoEn` (Ascending)

2. **Colección: `pagos`**
   - Campos: `fechaPago` (Ascending) + `estado` (Ascending)

3. **Colección: `reservaciones`**
   - Campos: `fechaHora` (Ascending) + `estado` (Ascending)

**Archivo de configuración**: Se incluye `firestore.indexes.json` en la raíz del proyecto para desplegar automáticamente:

```bash
firebase deploy --only firestore:indexes
```

---

### Notas Importantes sobre el Dashboard

- 📅 **Período por defecto**: Si no se especifican fechas, se muestran las métricas del día actual
- 🔄 **Datos en tiempo real**: Las métricas se calculan dinámicamente desde Firestore
- 📊 **Órdenes completadas**: Solo se cuentan órdenes con estado `completado` para los cálculos
- 💰 **Ingresos**: Basados en pagos con estado `completado`
- 📈 **Comparativa mensual**: El porcentaje de cambio compara con el mismo período del mes anterior
- 🎯 **Filtros flexibles**: Todos los endpoints admiten filtros por rango de fechas
- ⚡ **Performance**: Los índices compuestos son necesarios para consultas rápidas
- 🔐 **Permisos**: Solo usuarios con `ver_reportes` o `ver_todo` pueden acceder

---

## Módulo: Usuarios, Roles y Permisos

Este módulo implementa un sistema completo de gestión de usuarios con control de acceso basado en roles (RBAC) y registro de auditoría. El módulo está compuesto por tres componentes principales:

### Componentes del Módulo

1. **Usuarios**: Gestión completa de usuarios del sistema (CRUD)
2. **Roles y Permisos**: Sistema de permisos granulares por rol
3. **Registro de Autorizaciones**: Auditoría automática de todas las acciones importantes

### Características Principales

- ✅ CRUD completo de usuarios con validación de PIN (4-6 dígitos)
- ✅ Sistema de roles con permisos granulares en español
- ✅ Hashing seguro de PINs con bcrypt
- ✅ Registro automático de auditoría para todas las operaciones
- ✅ Middleware de permisos reutilizable
- ✅ Compatibilidad con rol `admin` legacy (acceso completo)
- ✅ Filtrado y estadísticas de autorizaciones

---

### 1. Gestión de Usuarios

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos Requeridos |
|--------|----------|-------------|---------------------|
| POST | `/api/usuarios` | Crear nuevo usuario | `gestionar_usuarios` |
| GET | `/api/usuarios` | Listar usuarios | `gestionar_usuarios` o `ver_todo` |
| GET | `/api/usuarios/:id` | Obtener usuario por ID | `gestionar_usuarios` o `ver_todo` |
| PUT | `/api/usuarios/:id` | Actualizar usuario | `gestionar_usuarios` o `editar_todo` |
| DELETE | `/api/usuarios/:id` | Eliminar usuario | `gestionar_usuarios` o `eliminar_todo` |
| POST | `/api/usuarios/:id/verificar-pin` | Verificar PIN de usuario | Cualquier usuario autenticado |

#### Modelo de Usuario

```json
{
  "id": "abc123",
  "nombre": "María García",
  "correo": "maria@restaurante.com",
  "rol": "cajero",
  "activo": true,
  "creadoEn": "2024-01-15T10:30:00.000Z",
  "actualizadoEn": "2024-01-15T10:30:00.000Z"
}
```

**Nota**: El PIN se almacena hasheado con bcrypt y nunca se expone en las respuestas.

#### Crear Usuario

```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nombre": "María García",
    "correo": "maria@restaurante.com",
    "rol": "cajero",
    "pinSeguridad": "5678",
    "activo": true
  }'
```

**Validaciones**:
- `nombre`: 3-100 caracteres
- `correo`: Formato de email válido, único en el sistema
- `rol`: Debe ser uno de: `dueno`, `gerente`, `cajero`, `mesero`, `cocinero`
- `pinSeguridad`: 4-6 dígitos numéricos
- `activo`: Booleano (opcional, por defecto `true`)

**Respuesta exitosa** (201):
```json
{
  "mensaje": "Usuario creado exitosamente",
  "usuario": {
    "id": "abc123",
    "nombre": "María García",
    "correo": "maria@restaurante.com",
    "rol": "cajero",
    "activo": true,
    "creadoEn": "2024-01-15T10:30:00.000Z",
    "actualizadoEn": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Listar Usuarios

```bash
# Listar todos los usuarios
curl -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por estado activo
curl -X GET "http://localhost:3000/api/usuarios?activo=true" \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por rol
curl -X GET "http://localhost:3000/api/usuarios?rol=cajero" \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "usuarios": [
    {
      "id": "abc123",
      "nombre": "María García",
      "correo": "maria@restaurante.com",
      "rol": "cajero",
      "activo": true,
      "creadoEn": "2024-01-15T10:30:00.000Z",
      "actualizadoEn": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### Obtener Usuario por ID

```bash
curl -X GET http://localhost:3000/api/usuarios/abc123 \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "usuario": {
    "id": "abc123",
    "nombre": "María García",
    "correo": "maria@restaurante.com",
    "rol": "cajero",
    "activo": true,
    "creadoEn": "2024-01-15T10:30:00.000Z",
    "actualizadoEn": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Actualizar Usuario

```bash
curl -X PUT http://localhost:3000/api/usuarios/abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nombre": "María García López",
    "rol": "gerente",
    "pinSeguridad": "123456",
    "activo": true
  }'
```

**Campos actualizables**:
- `nombre`: Nuevo nombre (opcional)
- `correo`: Nuevo correo (opcional, debe ser único)
- `rol`: Nuevo rol (opcional)
- `pinSeguridad`: Nuevo PIN (opcional, se re-hasheará automáticamente)
- `activo`: Estado activo (opcional)

**Respuesta exitosa** (200):
```json
{
  "mensaje": "Usuario actualizado exitosamente",
  "usuario": {
    "id": "abc123",
    "nombre": "María García López",
    "correo": "maria@restaurante.com",
    "rol": "gerente",
    "activo": true,
    "creadoEn": "2024-01-15T10:30:00.000Z",
    "actualizadoEn": "2024-01-15T11:45:00.000Z"
  }
}
```

#### Eliminar Usuario

```bash
curl -X DELETE http://localhost:3000/api/usuarios/abc123 \
  -H "Authorization: Bearer <TOKEN>"
```

**Nota**: No puedes eliminar tu propio usuario (auto-eliminación bloqueada).

**Respuesta exitosa** (200):
```json
{
  "mensaje": "Usuario eliminado exitosamente"
}
```

#### Verificar PIN

```bash
curl -X POST http://localhost:3000/api/usuarios/abc123/verificar-pin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "pin": "5678"
  }'
```

**Respuesta exitosa** (200):
```json
{
  "valido": true,
  "mensaje": "PIN verificado correctamente"
}
```

**Respuesta con PIN incorrecto** (401):
```json
{
  "valido": false,
  "mensaje": "PIN incorrecto"
}
```

---

### 2. Roles y Permisos

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos Requeridos |
|--------|----------|-------------|---------------------|
| GET | `/api/roles` | Listar todos los roles | Usuario autenticado |
| GET | `/api/roles/:id` | Obtener rol por ID | Usuario autenticado |
| GET | `/api/roles/permisos` | Listar todos los permisos | Usuario autenticado |
| GET | `/api/roles/:id/permisos` | Obtener permisos de un rol | Usuario autenticado |
| GET | `/api/roles/:id/verificar-permiso/:permiso` | Verificar si rol tiene permiso | Usuario autenticado |

#### Roles Disponibles en el Sistema

| Rol | ID | Descripción | Permisos |
|-----|-----|-------------|----------|
| Dueño | `dueno` | Control total del sistema | 12 permisos |
| Gerente | `gerente` | Gestión operativa | 6 permisos |
| Cajero | `cajero` | Procesamiento de pagos | 3 permisos |
| Mesero | `mesero` | Atención y pedidos | 4 permisos |
| Cocinero | `cocinero` | Gestión de cocina | 3 permisos |

#### Permisos del Sistema (17 permisos granulares)

| ID Permiso | Nombre | Descripción |
|-----------|--------|-------------|
| `ver_todo` | Ver Todo | Permiso de lectura total |
| `editar_todo` | Editar Todo | Permiso de edición total |
| `eliminar_todo` | Eliminar Todo | Permiso de eliminación total |
| `gestionar_usuarios` | Gestionar Usuarios | Crear, editar, eliminar usuarios |
| `gestionar_menu` | Gestionar Menú | Gestión completa del menú |
| `gestionar_pedidos` | Gestionar Pedidos | Gestión completa de pedidos |
| `ver_pedidos` | Ver Pedidos | Ver pedidos (solo lectura) |
| `gestionar_pagos` | Gestionar Pagos | Gestión completa de pagos |
| `procesar_pagos` | Procesar Pagos | Procesar transacciones de pago |
| `ver_reportes` | Ver Reportes | Acceso a reportes y estadísticas |
| `gestionar_mesas` | Gestionar Mesas | Gestión completa de mesas |
| `ver_mesas` | Ver Mesas | Ver estado de mesas (solo lectura) |
| `gestionar_reservaciones` | Gestionar Reservaciones | Gestión de reservaciones |
| `ver_cocina` | Ver Cocina | Ver pedidos en cocina |
| `actualizar_estado_pedido` | Actualizar Estado Pedido | Cambiar estado de pedidos en cocina |
| `ver_menu` | Ver Menú | Ver menú (solo lectura) |
| `gestionar_configuracion` | Gestionar Configuración | Gestión de configuración del sistema |

#### Distribución de Permisos por Rol

**Dueño** (12 permisos):
- ver_todo
- editar_todo
- eliminar_todo
- gestionar_usuarios
- gestionar_menu
- gestionar_pedidos
- gestionar_pagos
- ver_reportes
- gestionar_mesas
- gestionar_reservaciones
- gestionar_configuracion
- ver_cocina

**Gerente** (6 permisos):
- gestionar_pedidos
- gestionar_pagos
- ver_reportes
- gestionar_mesas
- gestionar_reservaciones
- ver_cocina

**Cajero** (3 permisos):
- procesar_pagos
- ver_pedidos
- ver_mesas

**Mesero** (4 permisos):
- gestionar_pedidos
- ver_menu
- ver_mesas
- gestionar_reservaciones

**Cocinero** (3 permisos):
- ver_cocina
- actualizar_estado_pedido
- ver_menu

#### Listar Todos los Roles

```bash
curl -X GET http://localhost:3000/api/roles \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "roles": [
    {
      "id": "dueno",
      "nombre": "Dueño",
      "descripcion": "Control total del sistema",
      "permisos": ["ver_todo", "editar_todo", "eliminar_todo", "..."]
    },
    {
      "id": "gerente",
      "nombre": "Gerente",
      "descripcion": "Gestión operativa del restaurante",
      "permisos": ["gestionar_pedidos", "gestionar_pagos", "..."]
    }
  ]
}
```

#### Obtener Rol por ID

```bash
curl -X GET http://localhost:3000/api/roles/gerente \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "rol": {
    "id": "gerente",
    "nombre": "Gerente",
    "descripcion": "Gestión operativa del restaurante",
    "permisos": [
      "gestionar_pedidos",
      "gestionar_pagos",
      "ver_reportes",
      "gestionar_mesas",
      "gestionar_reservaciones",
      "ver_cocina"
    ]
  }
}
```

#### Listar Todos los Permisos

```bash
curl -X GET http://localhost:3000/api/roles/permisos \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "permisos": [
    {
      "id": "ver_todo",
      "nombre": "Ver Todo",
      "descripcion": "Permiso de lectura total"
    },
    {
      "id": "gestionar_usuarios",
      "nombre": "Gestionar Usuarios",
      "descripcion": "Crear, editar, eliminar usuarios"
    }
  ]
}
```

#### Obtener Permisos de un Rol

```bash
curl -X GET http://localhost:3000/api/roles/gerente/permisos \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "rol": "gerente",
  "nombreRol": "Gerente",
  "permisos": [
    {
      "id": "gestionar_pedidos",
      "nombre": "Gestionar Pedidos",
      "descripcion": "Gestión completa de pedidos"
    },
    {
      "id": "gestionar_pagos",
      "nombre": "Gestionar Pagos",
      "descripcion": "Gestión completa de pagos"
    }
  ]
}
```

#### Verificar si un Rol tiene un Permiso

```bash
curl -X GET http://localhost:3000/api/roles/gerente/verificar-permiso/gestionar_pagos \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "rol": "gerente",
  "nombreRol": "Gerente",
  "permiso": "gestionar_pagos",
  "tienePermiso": true
}
```

---

### 3. Registro de Autorizaciones (Auditoría)

El sistema registra automáticamente todas las acciones importantes en el módulo de usuarios. Este registro de auditoría permite rastrear quién hizo qué, cuándo y con qué resultado.

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos Requeridos |
|--------|----------|-------------|---------------------|
| POST | `/api/autorizaciones` | Registrar autorización | Cualquier usuario autenticado |
| GET | `/api/autorizaciones` | Listar autorizaciones | `ver_reportes` o `ver_todo` |
| GET | `/api/autorizaciones/:id` | Obtener autorización por ID | `ver_reportes` o `ver_todo` |
| GET | `/api/autorizaciones/estadisticas` | Obtener estadísticas | `ver_reportes` o `ver_todo` |
| GET | `/api/autorizaciones/usuario/:usuarioId` | Obtener autorizaciones de usuario | `ver_todo` o `gestionar_usuarios` |

#### Modelo de Autorización

```json
{
  "id": "auth123",
  "fechaHora": "2024-01-15T10:30:00.000Z",
  "accion": "crear_usuario",
  "modulo": "usuarios",
  "usuario": {
    "id": "user123",
    "nombre": "Admin Principal",
    "rol": "admin"
  },
  "autorizadoPor": {
    "id": "user123",
    "nombre": "Admin Principal",
    "rol": "admin"
  },
  "detalles": {
    "nuevoUsuario": "María García",
    "rol": "cajero"
  },
  "ipAddress": "192.168.1.100",
  "resultado": "exitoso",
  "requiereAutorizacion": false,
  "autorizado": true
}
```

#### Acciones Registradas Automáticamente

**Módulo Usuarios**:
- `crear_usuario`: Creación de nuevo usuario
- `actualizar_usuario`: Actualización de usuario existente
- `eliminar_usuario`: Eliminación de usuario
- `cambiar_rol`: Cambio de rol de usuario
- `cambiar_pin`: Cambio de PIN de usuario
- `desactivar_usuario`: Desactivación de usuario
- `activar_usuario`: Activación de usuario

**Otras Acciones**:
- `intento_acceso_denegado`: Intento de acceso sin permisos
- `login`: Inicio de sesión
- `logout`: Cierre de sesión
- `crear_pedido`, `actualizar_pedido`, `eliminar_pedido`
- `procesar_pago`, `cancelar_pago`, `reembolso_pago`
- Y más...

#### Listar Autorizaciones con Filtros

```bash
# Todas las autorizaciones (últimas 50)
curl -X GET http://localhost:3000/api/autorizaciones \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por módulo
curl -X GET "http://localhost:3000/api/autorizaciones?modulo=usuarios" \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por acción
curl -X GET "http://localhost:3000/api/autorizaciones?accion=crear_usuario" \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por rango de fechas
curl -X GET "http://localhost:3000/api/autorizaciones?fechaInicio=2024-01-01T00:00:00.000Z&fechaFin=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer <TOKEN>"

# Filtrar por resultado
curl -X GET "http://localhost:3000/api/autorizaciones?resultado=fallido" \
  -H "Authorization: Bearer <TOKEN>"

# Limitar resultados
curl -X GET "http://localhost:3000/api/autorizaciones?limite=100" \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "autorizaciones": [
    {
      "id": "auth123",
      "fechaHora": "2024-01-15T10:30:00.000Z",
      "accion": "crear_usuario",
      "modulo": "usuarios",
      "usuario": {
        "id": "user123",
        "nombre": "Admin Principal",
        "rol": "admin"
      },
      "detalles": {
        "nuevoUsuario": "María García",
        "rol": "cajero"
      },
      "resultado": "exitoso"
    }
  ],
  "total": 1
}
```

#### Obtener Estadísticas de Autorizaciones

```bash
curl -X GET http://localhost:3000/api/autorizaciones/estadisticas \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "total": 15,
  "porModulo": {
    "usuarios": 8,
    "pedidos": 5,
    "pagos": 2
  },
  "porAccion": {
    "crear_usuario": 3,
    "actualizar_usuario": 2,
    "eliminar_usuario": 1,
    "intento_acceso_denegado": 2
  },
  "porResultado": {
    "exitoso": 13,
    "fallido": 2,
    "pendiente": 0
  },
  "porUsuario": {
    "Admin Principal": 10,
    "María García": 5
  },
  "requierenAutorizacion": 0
}
```

#### Obtener Autorizaciones de un Usuario

```bash
curl -X GET http://localhost:3000/api/autorizaciones/usuario/user123 \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa** (200):
```json
{
  "usuario": {
    "id": "user123",
    "nombre": "María García"
  },
  "autorizaciones": [
    {
      "id": "auth456",
      "fechaHora": "2024-01-15T11:00:00.000Z",
      "accion": "actualizar_usuario",
      "modulo": "usuarios",
      "resultado": "exitoso"
    }
  ],
  "total": 1
}
```

---

### Middleware de Permisos

El sistema incluye tres middlewares reutilizables para validar permisos en las rutas:

#### 1. `requierePermiso(...permisos)`

Valida que el usuario tenga **al menos uno** de los permisos especificados.

```javascript
// El usuario debe tener 'gestionar_usuarios' O 'ver_todo'
router.get('/usuarios', 
  verificarToken, 
  requierePermiso('gestionar_usuarios', 'ver_todo'),
  obtenerUsuarios
);
```

#### 2. `requiereTodosLosPermisos(...permisos)`

Valida que el usuario tenga **todos** los permisos especificados.

```javascript
// El usuario debe tener 'gestionar_usuarios' Y 'editar_todo'
router.put('/usuarios/:id', 
  verificarToken, 
  requiereTodosLosPermisos('gestionar_usuarios', 'editar_todo'),
  actualizarUsuario
);
```

#### 3. `requiereRol(...roles)`

Valida que el usuario tenga uno de los roles especificados.

```javascript
// Solo dueños y gerentes pueden acceder
router.get('/reportes', 
  verificarToken, 
  requiereRol('dueno', 'gerente'),
  obtenerReportes
);
```

**Nota**: El rol `admin` tiene acceso completo a todas las rutas por compatibilidad legacy.

---

### Ejemplo de Flujo Completo

#### 1. Login como Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correoElectronico": "admin@restaurante.com", "contrasena": "admin123"}'
```

#### 2. Crear Usuario Cajero
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "nombre": "María García",
    "correo": "maria@restaurante.com",
    "rol": "cajero",
    "pinSeguridad": "5678",
    "activo": true
  }'
```

#### 3. Verificar Permisos del Rol Cajero
```bash
curl -X GET http://localhost:3000/api/roles/cajero/permisos \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

#### 4. Ver Registro de Auditoría
```bash
curl -X GET "http://localhost:3000/api/autorizaciones?modulo=usuarios" \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

#### 5. Actualizar Usuario a Gerente
```bash
curl -X PUT http://localhost:3000/api/usuarios/<ID_MARIA> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{"rol": "gerente"}'
```

#### 6. Verificar PIN del Usuario
```bash
curl -X POST http://localhost:3000/api/usuarios/<ID_MARIA>/verificar-pin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{"pin": "5678"}'
```

---

### Notas Importantes

- **Seguridad del PIN**: Los PINs se almacenan hasheados con bcrypt (salt=10). Nunca se exponen en las respuestas.
- **Validación de PIN**: Debe ser numérico de 4-6 dígitos (ej: `1234`, `123456`).
- **Auto-eliminación**: No puedes eliminar tu propio usuario para prevenir bloqueos accidentales.
- **Auditoría Automática**: Todas las operaciones de usuarios se registran automáticamente en la colección `autorizaciones`.
- **Admin Legacy**: El rol `admin` tiene acceso completo por compatibilidad con usuarios existentes.
- **Duplicados**: El correo electrónico debe ser único en el sistema.
- **Filtros**: Las autorizaciones se pueden filtrar por fecha, acción, módulo, usuario y resultado.
- **Límite de Resultados**: Por defecto se devuelven las últimas 50 autorizaciones. Puedes especificar hasta 500.

---

## Roles Disponibles

| Rol | Descripción |
|-----|-------------|
| `admin` | Administrador del sistema con acceso completo |
| `gerente` | Gerente del restaurante |
| `cajero` | Cajero/Punto de venta |
| `mesero` | Mesero/Atención al cliente |
| `cocinero` | Cocinero/Personal de cocina |

---

## Estructura del Proyecto

```
POS-Restaurant/
├── src/
│   ├── config/
│   │   └── firebase.js          # Configuración de Firebase
│   ├── controllers/
│   │   └── authController.js    # Lógica de autenticación
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT y roles
│   ├── models/
│   │   └── Usuario.js           # Modelo de Usuario
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   └── index.js             # Enrutador principal
│   └── index.js                 # Servidor Express
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── serviceAccountKey.json       # Credenciales de Firebase (no incluir en git)
└── README.md
```

---

## 🔒 Notas de Seguridad

- Los tokens JWT expiran en 24 horas por defecto (configurable en `.env`)
- Las contraseñas se hashean con bcrypt antes de almacenarse
- El archivo `serviceAccountKey.json` NO debe incluirse en el control de versiones
- En producción, cambia `JWT_SECRET` por una clave segura y aleatoria
- Las contraseñas deben tener mínimo 6 caracteres
