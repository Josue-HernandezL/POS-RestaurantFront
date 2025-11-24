// Dashboard Management System
class DashboardManager {
    constructor() {
        this.apiBaseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.currentPeriod = 'today';
        this.customDateRange = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        
        // Auto-refresh every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            this.refreshMetrics();
        }, 30000);
    }

    setupEventListeners() {
        // Period filter
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.handlePeriodChange();
        });

        // Custom date range
        document.getElementById('applyFilter').addEventListener('click', () => {
            this.applyCustomDateRange();
        });

        // Error handling for token expiry
        window.addEventListener('beforeunload', () => {
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
            }
        });
    }

    handlePeriodChange() {
        const customDateRange = document.getElementById('customDateRange');
        
        if (this.currentPeriod === 'custom') {
            customDateRange.style.display = 'flex';
            this.setDefaultCustomRange();
        } else {
            customDateRange.style.display = 'none';
            this.customDateRange = null;
            this.loadDashboardData();
        }
    }

    setDefaultCustomRange() {
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        document.getElementById('fechaInicio').value = this.formatDate(monthAgo);
        document.getElementById('fechaFin').value = this.formatDate(today);
    }

    applyCustomDateRange() {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        
        if (!fechaInicio || !fechaFin) {
            this.showError('Por favor selecciona ambas fechas');
            return;
        }
        
        if (new Date(fechaInicio) > new Date(fechaFin)) {
            this.showError('La fecha de inicio debe ser anterior a la fecha final');
            return;
        }
        
        this.customDateRange = {
            fechaInicio: new Date(fechaInicio).toISOString(),
            fechaFin: new Date(fechaFin + 'T23:59:59').toISOString()
        };
        
        this.loadDashboardData();
    }

    getDateRangeParams() {
        if (this.customDateRange) {
            return `?fechaInicio=${encodeURIComponent(this.customDateRange.fechaInicio)}&fechaFin=${encodeURIComponent(this.customDateRange.fechaFin)}`;
        }
        
        const today = new Date();
        let fechaInicio, fechaFin;
        
        switch (this.currentPeriod) {
            case 'week':
                fechaInicio = new Date(today);
                fechaInicio.setDate(fechaInicio.getDate() - 7);
                fechaFin = today;
                break;
            case 'month':
                fechaInicio = new Date(today);
                fechaInicio.setMonth(fechaInicio.getMonth() - 1);
                fechaFin = today;
                break;
            case 'today':
            default:
                fechaInicio = new Date(today);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin = new Date(today);
                fechaFin.setHours(23, 59, 59, 999);
                break;
        }
        
        return `?fechaInicio=${encodeURIComponent(fechaInicio.toISOString())}&fechaFin=${encodeURIComponent(fechaFin.toISOString())}`;
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseURL}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (response.status === 401) {
                this.handleAuthError();
                return null;
            }

            if (!response.ok) {
                // For development: Return mock data if API is not available
                if (response.status === 0 || response.status >= 500) {
                    console.warn('API not available, using mock data');
                    return this.getMockData(endpoint);
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request error:', error);
            
            // For development: Return mock data if network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.warn('Network error, using mock data');
                return this.getMockData(endpoint);
            }
            
            this.showError(`Error al cargar datos: ${error.message}`);
            return null;
        }
    }

    getMockData(endpoint) {
        // Mock data for development
        const mockData = {
            '/dashboard/resumen': {
                metricas: {
                    ingresosTotales: 15250.50,
                    porcentajeCambioIngresos: 12.5,
                    totalOrdenes: 85,
                    ordenesCompletadas: 85,
                    ticketPromedio: 179.42,
                    reservaciones: 12,
                    ordenesPendientes: 3,
                    ordenesEnPreparacion: 5,
                    propinaPromedio: 25.50,
                    propinaPorcentaje: 14.2,
                    itemsEnMenu: 45
                },
                ventasPorCategoria: [
                    {
                        categoria: "Platos Principales",
                        total: 8500.00,
                        cantidad: 120,
                        porcentaje: 55.74
                    },
                    {
                        categoria: "Bebidas",
                        total: 3200.00,
                        cantidad: 200,
                        porcentaje: 20.98
                    },
                    {
                        categoria: "Entradas",
                        total: 2100.00,
                        cantidad: 85,
                        porcentaje: 13.77
                    },
                    {
                        categoria: "Postres",
                        total: 1450.50,
                        cantidad: 60,
                        porcentaje: 9.51
                    }
                ],
                productosMasVendidos: [
                    {
                        itemId: "item123",
                        nombre: "Hamburguesa Clásica",
                        categoria: "Platos Principales",
                        cantidadVendida: 45,
                        totalVentas: 4500.00
                    },
                    {
                        itemId: "item456",
                        nombre: "Pizza Margherita",
                        categoria: "Platos Principales",
                        cantidadVendida: 38,
                        totalVentas: 3800.00
                    },
                    {
                        itemId: "item789",
                        nombre: "Ensalada César",
                        categoria: "Entradas",
                        cantidadVendida: 32,
                        totalVentas: 1600.00
                    },
                    {
                        itemId: "item101",
                        nombre: "Pasta Carbonara",
                        categoria: "Platos Principales",
                        cantidadVendida: 28,
                        totalVentas: 2800.00
                    },
                    {
                        itemId: "item102",
                        nombre: "Sopa del Día",
                        categoria: "Entradas",
                        cantidadVendida: 25,
                        totalVentas: 1250.00
                    }
                ],
                ordenesRecientes: [
                    {
                        id: "orden123",
                        mesaId: "mesa1",
                        mesaNumero: 5,
                        estado: "completado",
                        total: 250.00,
                        totalItems: 3,
                        creadoEn: new Date(Date.now() - 1800000).toISOString()
                    },
                    {
                        id: "orden124",
                        mesaId: "mesa2",
                        mesaNumero: 3,
                        estado: "en_preparacion",
                        total: 180.50,
                        totalItems: 2,
                        creadoEn: new Date(Date.now() - 900000).toISOString()
                    },
                    {
                        id: "orden125",
                        mesaId: "mesa3",
                        mesaNumero: 7,
                        estado: "pendiente",
                        total: 320.75,
                        totalItems: 4,
                        creadoEn: new Date(Date.now() - 300000).toISOString()
                    }
                ]
            }
        };

        // Extract base endpoint without query parameters
        const baseEndpoint = endpoint.split('?')[0];
        return mockData[baseEndpoint] || null;
    }

    handleAuthError() {
        localStorage.removeItem('authToken');
        this.showError('Sesión expirada. Redirigiendo al login...');
        setTimeout(() => {
            window.location.href = '/views/login.html';
        }, 2000);
    }

    async loadDashboardData() {
        this.showLoading(true);
        
        try {
            // Get complete dashboard summary
            const params = this.getDateRangeParams();
            const data = await this.makeRequest(`/dashboard/resumen${params}`);
            
            if (data) {
                await this.updateDashboardUI(data);
                this.hideError();
            }
        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showError('Error al cargar el dashboard');
        } finally {
            this.showLoading(false);
        }
    }

    async refreshMetrics() {
        // Only refresh metrics without loading overlay
        try {
            const params = this.getDateRangeParams();
            const data = await this.makeRequest(`/dashboard/metricas${params}`);
            
            if (data && data.metricas) {
                this.updateMainMetrics(data.metricas);
            }
        } catch (error) {
            console.error('Metrics refresh error:', error);
        }
    }

    async updateDashboardUI(data) {
        if (data.metricas) {
            this.updateMainMetrics(data.metricas);
        }
        
        if (data.ventasPorCategoria) {
            this.updateSalesByCategory(data.ventasPorCategoria);
        }
        
        if (data.productosMasVendidos) {
            this.updateTopProducts(data.productosMasVendidos);
        }
        
        if (data.ordenesRecientes) {
            this.updateRecentOrders(data.ordenesRecientes);
        }
        
        // Load items count separately if not included
        if (!data.metricas || data.metricas.itemsEnMenu === undefined) {
            await this.loadItemsCount();
        }
    }

    updateMainMetrics(metricas) {
        // Main metrics cards
        document.getElementById('ingresosTotales').textContent = this.formatCurrency(metricas.ingresosTotales || 0);
        document.getElementById('totalOrdenes').textContent = (metricas.totalOrdenes || 0).toString();
        document.getElementById('ordenesCompletadas').textContent = (metricas.ordenesCompletadas || 0).toString();
        document.getElementById('ticketPromedio').textContent = this.formatCurrency(metricas.ticketPromedio || 0);
        document.getElementById('reservaciones').textContent = (metricas.reservaciones || 0).toString();
        document.getElementById('reservacionesConfirmadas').textContent = (metricas.reservaciones || 0).toString();
        
        // Secondary metrics
        document.getElementById('ordenesPendientes').textContent = (metricas.ordenesPendientes || 0).toString();
        document.getElementById('ordenesEnPreparacion').textContent = (metricas.ordenesEnPreparacion || 0).toString();
        document.getElementById('propinaPorcentaje').textContent = (metricas.propinaPorcentaje || 0).toFixed(1);
        
        if (metricas.itemsEnMenu !== undefined) {
            document.getElementById('itemsEnMenu').textContent = (metricas.itemsEnMenu || 0).toString();
        }
        
        // Update percentage change
        const cambioElement = document.getElementById('cambioIngresos');
        if (metricas.porcentajeCambioIngresos !== undefined) {
            const cambio = metricas.porcentajeCambioIngresos;
            const signo = cambio >= 0 ? '+' : '';
            cambioElement.textContent = `${signo}${cambio.toFixed(1)}% vs mes anterior`;
            cambioElement.className = cambio >= 0 ? 'metric-change' : 'metric-change negative';
        }
    }

    updateSalesByCategory(ventas) {
        const container = document.getElementById('ventasPorCategoria');
        
        if (!ventas || ventas.length === 0) {
            container.innerHTML = '<div class="no-data">No hay datos de ventas por categoría</div>';
            return;
        }
        
        const total = ventas.reduce((sum, item) => sum + item.total, 0);
        
        container.innerHTML = ventas.map(categoria => `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-name">${categoria.categoria}</span>
                    <span class="category-amount">${this.formatCurrency(categoria.total)}</span>
                </div>
                <div class="category-bar">
                    <div class="bar-fill" style="width: ${categoria.porcentaje || 0}%"></div>
                </div>
                <div class="category-percentage">${(categoria.porcentaje || 0).toFixed(1)}% del total</div>
            </div>
        `).join('');
    }

    updateTopProducts(productos) {
        const container = document.getElementById('productosMasVendidos');
        
        if (!productos || productos.length === 0) {
            container.innerHTML = '<div class="no-data">No hay datos de productos vendidos</div>';
            return;
        }
        
        container.innerHTML = productos.map((producto, index) => `
            <div class="product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${producto.nombre}</div>
                    <div class="product-category">${producto.categoria}</div>
                </div>
                <div class="product-stats">
                    <div class="product-quantity">${producto.cantidadVendida} vendidos</div>
                    <div class="product-total">${this.formatCurrency(producto.totalVentas)}</div>
                </div>
            </div>
        `).join('');
    }

    updateRecentOrders(ordenes) {
        const container = document.getElementById('ordenesRecientes');
        
        if (!ordenes || ordenes.length === 0) {
            container.innerHTML = '<div class="no-orders"><p>No hay órdenes registradas</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="orders-list">
                ${ordenes.map(orden => `
                    <div class="order-item">
                        <div class="order-info">
                            <div class="order-number">Orden #${orden.id.slice(-6)}</div>
                            <div class="order-table">Mesa ${orden.mesaNumero || 'N/A'}</div>
                            <div class="order-status ${orden.estado}">${this.getEstadoLabel(orden.estado)}</div>
                        </div>
                        <div class="order-total">${this.formatCurrency(orden.total)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadItemsCount() {
        try {
            const data = await this.makeRequest('/dashboard/items-menu');
            if (data && data.itemsEnMenu !== undefined) {
                document.getElementById('itemsEnMenu').textContent = data.itemsEnMenu.toString();
            }
        } catch (error) {
            console.error('Error loading items count:', error);
        }
    }

    getEstadoLabel(estado) {
        const estados = {
            'pendiente': 'Pendiente',
            'en_preparacion': 'En Preparación',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return estados[estado] || estado;
    }

    formatCurrency(amount) {
        return (amount || 0).toFixed(2);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const header = document.querySelector('.dashboard-header');
        header.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    hideError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const header = document.querySelector('.dashboard-header');
        header.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    let token = localStorage.getItem('authToken');
    
    // For development: Create a temporary token if none exists
    if (!token) {
        token = 'dev_token_' + Date.now();
        localStorage.setItem('authToken', token);
        console.log('Development mode: Using temporary token');
    }
    
    // For development: Create temporary user data if none exists
    if (!localStorage.getItem('user')) {
        const mockUser = {
            nombreCompleto: 'Usuario Demo',
            rol: 'administrador',
            email: 'demo@restaurant.com'
        };
        localStorage.setItem('user', JSON.stringify(mockUser));
    }
    
    // Initialize dashboard
    window.dashboardManager = new DashboardManager();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}