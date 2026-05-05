// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURACIÓN DE USUARIOS ADMIN
// ============================================
// IMPORTANTE: Cambia estos usuarios y contraseñas
const ADMIN_USERS = {
    'admin': 'admin123',          // Usuario: admin, Password: admin123
    'supervisor': 'supervisor123'  // Usuario: supervisor, Password: supervisor123
};

// ============================================
// ESTADO GLOBAL
// ============================================
let allReports = [];
let currentFilter = 'all';
let isLoggedIn = false;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    setupLoginForm();
});

// ============================================
// GESTIÓN DE LOGIN
// ============================================
function checkLogin() {
    const session = sessionStorage.getItem('admin_logged_in');
    if (session === 'true') {
        isLoggedIn = true;
        showAdminPanel();
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (ADMIN_USERS[username] && ADMIN_USERS[username] === password) {
            // Login exitoso
            sessionStorage.setItem('admin_logged_in', 'true');
            sessionStorage.setItem('admin_username', username);
            isLoggedIn = true;
            showAdminPanel();
        } else {
            // Login fallido
            const errorDiv = document.getElementById('login-error');
            errorDiv.textContent = '❌ Usuario o contraseña incorrectos';
            errorDiv.style.display = 'block';
        }
    });
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    
    // Cargar reportes y configurar funcionalidades
    loadReports();
    setupForm();
    subscribeToChanges();
}

function logout() {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('admin_username');
        location.reload();
    }
}

// ============================================
// NAVEGACIÓN ENTRE VISTAS
// ============================================
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (viewName === 'dashboard') {
        document.querySelector('.nav-btn:first-child').classList.add('active');
    } else if (viewName === 'form') {
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
    }
}

// ============================================
// CARGAR REPORTES DESDE SUPABASE
// ============================================
async function loadReports() {
    try {
        const { data, error } = await supabase
            .from('reportes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error al cargar reportes:', error);
            showError('Error al cargar reportes');
            return;
        }
        
        allReports = data || [];
        updateStatistics();
        renderReports();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function updateStatistics() {
    const stats = {
        total: allReports.length,
        pendientes: allReports.filter(r => r.estado === 'pendiente').length,
        enProceso: allReports.filter(r => r.estado === 'en_proceso').length,
        resueltos: allReports.filter(r => r.estado === 'resuelto').length,
    };
    
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pending').textContent = stats.pendientes;
    document.getElementById('stat-progress').textContent = stats.enProceso;
    document.getElementById('stat-resolved').textContent = stats.resueltos;
}

// ============================================
// RENDERIZAR REPORTES
// ============================================
function renderReports() {
    const reportsList = document.getElementById('reports-list');
    
    const filteredReports = currentFilter === 'all' 
        ? allReports 
        : allReports.filter(r => r.tipo === currentFilter);
    
    if (filteredReports.length === 0) {
        reportsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No hay reportes registrados</p>
                <button class="btn-primary" onclick="showView('form')">
                    Crear primer reporte
                </button>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div class="report-type">
                    <span class="type-badge ${report.tipo}">
                        ${formatTipo(report.tipo)}
                    </span>
                    <span class="severity-badge ${report.gravedad}">
                        ${report.gravedad}
                    </span>
                </div>
                <div class="report-date">
                    ${formatDate(report.created_at)}
                </div>
            </div>
            
            <div class="report-body">
                <div class="report-info">
                    <div class="info-row">
                        <span class="info-label">Área:</span>
                        <span class="info-value">${report.area}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Empleado:</span>
                        <span class="info-value">${report.empleado}</span>
                    </div>
                    <div class="info-row description">
                        <span class="info-label">Descripción:</span>
                        <span class="info-value">${report.descripcion}</span>
                    </div>
                </div>
            </div>

            <div class="report-footer">
                <select 
                    class="status-select ${report.estado}"
                    onchange="updateStatus('${report.id}', this.value)"
                >
                    <option value="pendiente" ${report.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="en_proceso" ${report.estado === 'en_proceso' ? 'selected' : ''}>🔄 En Proceso</option>
                    <option value="resuelto" ${report.estado === 'resuelto' ? 'selected' : ''}>✅ Resuelto</option>
                </select>
                <button class="btn-delete" onclick="deleteReport('${report.id}')">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

// ============================================
// FILTRAR REPORTES
// ============================================
function filterReports(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderReports();
}

// ============================================
// ACTUALIZAR ESTADO DE REPORTE
// ============================================
async function updateStatus(reportId, newStatus) {
    try {
        const { error } = await supabase
            .from('reportes')
            .update({ estado: newStatus })
            .eq('id', reportId);
        
        if (error) {
            console.error('Error al actualizar estado:', error);
            showError('Error al actualizar estado');
            return;
        }
        
        const reportIndex = allReports.findIndex(r => r.id === reportId);
        if (reportIndex !== -1) {
            allReports[reportIndex].estado = newStatus;
            updateStatistics();
            renderReports();
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// ============================================
// ELIMINAR REPORTE
// ============================================
async function deleteReport(reportId) {
    if (!confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('reportes')
            .delete()
            .eq('id', reportId);
        
        if (error) {
            console.error('Error al eliminar reporte:', error);
            showError('Error al eliminar reporte');
            return;
        }
        
        // Eliminar del estado local
        allReports = allReports.filter(r => r.id !== reportId);
        updateStatistics();
        renderReports();
        showSuccess('Reporte eliminado correctamente');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// ============================================
// CONFIGURAR FORMULARIO
// ============================================
function setupForm() {
    const form = document.getElementById('report-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const report = {
            tipo: formData.get('tipo'),
            area: formData.get('area'),
            empleado: formData.get('empleado'),
            descripcion: formData.get('descripcion'),
            gravedad: formData.get('gravedad'),
            estado: 'pendiente'
        };
        
        try {
            const { data, error } = await supabase
                .from('reportes')
                .insert([report])
                .select();
            
            if (error) {
                console.error('Error al crear reporte:', error);
                showError('Error al crear reporte: ' + error.message);
                return;
            }
            
            form.reset();
            showSuccess('Reporte creado exitosamente');
            showView('dashboard');
            await loadReports();
            
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión');
        }
    });
}

// ============================================
// SUSCRIBIRSE A CAMBIOS EN TIEMPO REAL
// ============================================
function subscribeToChanges() {
    supabase
        .channel('reportes-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'reportes' }, 
            (payload) => {
                console.log('Cambio detectado:', payload);
                loadReports();
            }
        )
        .subscribe();
}

// ============================================
// UTILIDADES
// ============================================
function formatTipo(tipo) {
    const tipos = {
        'acto_inseguro': 'ACTO INSEGURO',
        'apercibimiento': 'APERCIBIMIENTO',
        'falla_calidad': 'FALLA DE CALIDAD',
        'otro': 'OTRO'
    };
    return tipos[tipo] || tipo;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-AR', options);
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}
