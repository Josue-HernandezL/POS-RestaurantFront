import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

import cors from 'cors';
app.use(cors());


// Archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));


// Ruta raíz → redirigir a login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
  const loginPath = path.join(__dirname, '..', 'public', 'views', 'login.html');
  res.sendFile(loginPath);
});


// Registro
app.get('/registro', (req, res) => {
  const registroPath = path.join(__dirname, '..', 'public', 'views', 'registro.html');
  res.sendFile(registroPath);
});


// Principal (dashboard)
app.get('/dashboard', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'public', 'dashboard.html');
  res.sendFile(indexPath);
});

// Mapa de mesas
app.get('/mapa-mesas', (req, res) => {
  const mapaMesasPath = path.join(__dirname, '..', 'public', 'views', 'table-map.html');
  res.sendFile(mapaMesasPath);
})

// Pedidos 
app.get('/pedidos', (req, res) => {
  const pedidosPath = path.join(__dirname, '..', 'public', 'views', 'orders.html');
  res.sendFile(pedidosPath);
});

// Pagos
app.get('/pagos', (req, res) => {
  const pagosPath = path.join(__dirname, '..', 'public', 'views', 'payments.html');
  res.sendFile(pagosPath);
});

// Cocina
app.get('/cocina', (req, res) => {
  const cocinaPath = path.join(__dirname, '..', 'public', 'views', 'kitchen.html');
  res.sendFile(cocinaPath);
});

// Reservaciones 
app.get('/reservaciones', (req, res) => {
  const reservacionesPath = path.join(__dirname, '..', 'public', 'views', 'reservations.html');
  res.sendFile(reservacionesPath);
});

// Gestion de menu
app.get('/gestion-menu', (req, res) => {
  const gestionMenuPath = path.join(__dirname, '..', 'public', 'views', 'menu-management.html');
  res.sendFile(gestionMenuPath);
});

//Administracion 
app.get('/administracion', (req, res) => {
  const administracionPath = path.join(__dirname, '..', 'public', 'views', 'administration.html');
  res.sendFile(administracionPath);
});

// Usuarios y roles
app.get('/usuarios-roles', (req, res) => {
  const usuariosRolesPath = path.join(__dirname, '..', 'public', 'views', 'users-and-roles.html');
  res.sendFile(usuariosRolesPath);
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});