// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = 'https://dpzdlwwfvjoggejkaeiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwemRsd3dmdmpvZ2dlamthZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTQ1MTYsImV4cCI6MjA5MzU3MDUxNn0.2oSGq1RgelrXimeg8WuO6lc0RYUFeBq-5hWy3ZccN2c';


// Inicializar cliente de Supabase
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    loadFilters();  // ← AGREGADO: Cargar filtros dinámicos
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
        // Cargar opciones dinámicas del formulario
        loadFormOptions();
    } else if (viewName === 'config') {
        document.querySelectorAll('.nav-btn')[2].classList.add('active');
        // Cargar datos de configuración
        loadCentros();
        loadAreas();
        loadTipos();
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
// CARGAR FILTROS DINÁMICOS
// ============================================
async function loadFilters() {
    try {
        const { data: tipos, error } = await supabase
            .from('tipos_reporte')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error || !tipos || tipos.length === 0) {
            console.error('Error al cargar tipos para filtros:', error);
            return;
        }
        
        const filtersContainer = document.querySelector('.filters');
        if (!filtersContainer) return;
        
        // Crear HTML de filtros dinámicos
        const filtersHTML = `
            <button class="filter-btn active" onclick="filterReports('all')">Todos</button>
            ${tipos.map(tipo => `
                <button class="filter-btn" onclick="filterReports('${tipo.codigo}')">${tipo.nombre}</button>
            `).join('')}
        `;
        
        filtersContainer.innerHTML = filtersHTML;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function updateStatistics() {
    const stats = {
        reconocimientos: allReports.filter(r => r.tipo_accion === 'reconocimiento').length,
        llamados: allReports.filter(r => r.tipo_accion === 'llamado_atencion').length,
    };
    
    const reconocimientosEl = document.getElementById('stat-reconocimientos');
    const llamadosEl = document.getElementById('stat-llamados');
    
    if (reconocimientosEl) reconocimientosEl.textContent = stats.reconocimientos;
    if (llamadosEl) llamadosEl.textContent = stats.llamados;
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
                        ${formatTipoDisplay(report.tipo)}
                    </span>
                    <span class="severity-badge ${report.tipo_accion || 'llamado_atencion'}">
                        ${report.tipo_accion === 'reconocimiento' ? '✅ Reconocimiento' : '⚠️ Llamado de Atención'}
                    </span>
                </div>
                <div class="report-date">
                    ${formatDate(report.created_at)}
                </div>
            </div>
            
            <div class="report-body">
                <div class="report-info">
                    ${report.centro_productivo ? `
                    <div class="info-row">
                        <span class="info-label">Centro:</span>
                        <span class="info-value">${report.centro_productivo}</span>
                    </div>
                    ` : ''}
                    ${report.reportado_por ? `
                    <div class="info-row">
                        <span class="info-label">Reportado por:</span>
                        <span class="info-value">${report.reportado_por}</span>
                    </div>
                    ` : ''}
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
            tipo_accion: formData.get('tipo_accion'),
            centro_productivo: formData.get('centro_productivo'),
            reportado_por: formData.get('reportado_por'),
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
async function formatTipoDisplay(codigo) {
    // Intentar obtener el nombre desde la base de datos
    try {
        const { data: tipos } = await supabase
            .from('tipos_reporte')
            .select('nombre, codigo')
            .eq('codigo', codigo)
            .single();
        
        if (tipos) {
            return tipos.nombre.toUpperCase();
        }
    } catch (error) {
        console.log('Usando nombre por defecto para:', codigo);
    }
    
    // Fallback a nombres por defecto
    const tiposDefault = {
        'acto_inseguro': 'ACTO INSEGURO',
        'apercibimiento': 'APERCIBIMIENTO',
        'falla_calidad': 'FALLA DE CALIDAD',
        'seguridad': 'SEGURIDAD',
        'inocuidad': 'INOCUIDAD',
        'operaciones': 'OPERACIONES',
        'calidad': 'CALIDAD',
        'otro': 'OTRO'
    };
    return tiposDefault[codigo] || codigo.toUpperCase();
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

// ============================================
// GESTIÓN DE CENTROS PRODUCTIVOS
// ============================================

// Cargar centros productivos
async function loadCentros() {
    try {
        const { data, error } = await supabase
            .from('centros_productivos')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('Error al cargar centros:', error);
            return;
        }
        
        const centrosList = document.getElementById('centros-list');
        if (!centrosList) return;
        
        if (data.length === 0) {
            centrosList.innerHTML = '<p style="color: var(--color-text-secondary);">No hay centros configurados</p>';
            return;
        }
        
        centrosList.innerHTML = data.map(centro => `
            <div class="config-item">
                <span>${centro.nombre}</span>
                <div class="config-item-actions">
                    <button class="btn-small btn-edit" onclick="editCentro(${centro.id}, '${centro.nombre.replace(/'/g, "\\'")}')">Editar</button>
                    <button class="btn-small btn-remove" onclick="deleteCentro(${centro.id}, '${centro.nombre.replace(/'/g, "\\'")}')">Eliminar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Agregar centro
function addCentro() {
    const nombre = prompt('Nombre del centro productivo:');
    if (!nombre || nombre.trim() === '') return;
    
    supabase
        .from('centros_productivos')
        .insert([{ nombre: nombre.trim() }])
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al agregar centro: ' + error.message);
            } else {
                alert('✅ Centro agregado correctamente');
                loadCentros();
            }
        });
}

// Editar centro
function editCentro(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del centro:', nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    if (nuevoNombre === nombreActual) return;
    
    supabase
        .from('centros_productivos')
        .update({ nombre: nuevoNombre.trim() })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al actualizar centro: ' + error.message);
            } else {
                alert('✅ Centro actualizado correctamente');
                loadCentros();
            }
        });
}

// Eliminar centro
function deleteCentro(id, nombre) {
    if (!confirm(`¿Eliminar el centro "${nombre}"?\n\nEsto no eliminará los reportes existentes, solo ocultará el centro del formulario.`)) {
        return;
    }
    
    supabase
        .from('centros_productivos')
        .update({ activo: false })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al eliminar centro: ' + error.message);
            } else {
                alert('✅ Centro eliminado correctamente');
                loadCentros();
            }
        });
}

// ============================================
// GESTIÓN DE ÁREAS
// ============================================

// Cargar áreas desde Supabase
async function loadAreas() {
    try {
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('Error al cargar áreas:', error);
            return;
        }
        
        const areasList = document.getElementById('areas-list');
        if (!areasList) return;
        
        if (data.length === 0) {
            areasList.innerHTML = '<p style="color: var(--color-text-secondary);">No hay áreas configuradas</p>';
            return;
        }
        
        areasList.innerHTML = data.map(area => `
            <div class="config-item">
                <span>${area.nombre}</span>
                <div class="config-item-actions">
                    <button class="btn-small btn-edit" onclick="editArea(${area.id}, '${area.nombre.replace(/'/g, "\\'")}')">Editar</button>
                    <button class="btn-small btn-remove" onclick="deleteArea(${area.id}, '${area.nombre.replace(/'/g, "\\'")}')">Eliminar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Agregar área
function addArea() {
    const nombre = prompt('Nombre del área:');
    if (!nombre || nombre.trim() === '') return;
    
    supabase
        .from('areas')
        .insert([{ nombre: nombre.trim() }])
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al agregar área: ' + error.message);
            } else {
                alert('✅ Área agregada correctamente');
                loadAreas();
            }
        });
}

// Editar área
function editArea(id, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del área:', nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    if (nuevoNombre === nombreActual) return;
    
    supabase
        .from('areas')
        .update({ nombre: nuevoNombre.trim() })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al actualizar área: ' + error.message);
            } else {
                alert('✅ Área actualizada correctamente');
                loadAreas();
            }
        });
}

// Eliminar área
function deleteArea(id, nombre) {
    if (!confirm(`¿Eliminar el área "${nombre}"?\n\nEsto no eliminará los reportes existentes, solo ocultará el área del formulario.`)) {
        return;
    }
    
    supabase
        .from('areas')
        .update({ activo: false })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al eliminar área: ' + error.message);
            } else {
                alert('✅ Área eliminada correctamente');
                loadAreas();
            }
        });
}

// ============================================
// GESTIÓN DE TIPOS
// ============================================

// Cargar tipos de reporte
async function loadTipos() {
    try {
        const { data, error } = await supabase
            .from('tipos_reporte')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error) {
            console.error('Error al cargar tipos:', error);
            return;
        }
        
        const tiposList = document.getElementById('tipos-list');
        if (!tiposList) return;
        
        if (data.length === 0) {
            tiposList.innerHTML = '<p style="color: var(--color-text-secondary);">No hay tipos configurados</p>';
            return;
        }
        
        tiposList.innerHTML = data.map(tipo => `
            <div class="config-item">
                <div>
                    <strong>${tipo.nombre}</strong>
                    <br><small style="color: var(--color-text-secondary);">Código: ${tipo.codigo}</small>
                </div>
                <div class="config-item-actions">
                    <button class="btn-small btn-edit" onclick="editTipo(${tipo.id}, '${tipo.codigo}', '${tipo.nombre.replace(/'/g, "\\'")}')">Editar</button>
                    <button class="btn-small btn-remove" onclick="deleteTipo(${tipo.id}, '${tipo.nombre.replace(/'/g, "\\'")}')">Eliminar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Agregar tipo
function addTipo() {
    const nombre = prompt('Nombre del tipo de reporte:');
    if (!nombre || nombre.trim() === '') return;
    
    const codigo = prompt('Código del tipo (sin espacios, ej: falla_maquinaria):');
    if (!codigo || codigo.trim() === '') return;
    
    supabase
        .from('tipos_reporte')
        .insert([{ 
            codigo: codigo.trim().toLowerCase().replace(/ /g, '_'),
            nombre: nombre.trim() 
        }])
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al agregar tipo: ' + error.message);
            } else {
                alert('✅ Tipo agregado correctamente');
                loadTipos();
                loadFilters(); // Recargar filtros
            }
        });
}

// Editar tipo
function editTipo(id, codigoActual, nombreActual) {
    const nuevoNombre = prompt('Nuevo nombre del tipo:', nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    if (nuevoNombre === nombreActual) return;
    
    supabase
        .from('tipos_reporte')
        .update({ nombre: nuevoNombre.trim() })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al actualizar tipo: ' + error.message);
            } else {
                alert('✅ Tipo actualizado correctamente');
                loadTipos();
                loadFilters(); // Recargar filtros
            }
        });
}

// Eliminar tipo
function deleteTipo(id, nombre) {
    if (!confirm(`¿Eliminar el tipo "${nombre}"?\n\nEsto no eliminará los reportes existentes, solo ocultará el tipo del formulario.`)) {
        return;
    }
    
    supabase
        .from('tipos_reporte')
        .update({ activo: false })
        .eq('id', id)
        .then(({ error }) => {
            if (error) {
                alert('❌ Error al eliminar tipo: ' + error.message);
            } else {
                alert('✅ Tipo eliminado correctamente');
                loadTipos();
                loadFilters(); // Recargar filtros
            }
        });
}

// ============================================
// CARGAR OPCIONES DINÁMICAS EN FORMULARIO
// ============================================
async function loadFormOptions() {
    // Cargar centros productivos
    const { data: centros } = await supabase
        .from('centros_productivos')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true});
    
    const centroSelect = document.getElementById('centro_productivo');
    if (centroSelect && centros && centros.length > 0) {
        centroSelect.innerHTML = '<option value="">Seleccionar centro</option>' + 
            centros.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    }

    // Cargar tipos de reporte
    const { data: tipos } = await supabase
        .from('tipos_reporte')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true});
    
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect && tipos && tipos.length > 0) {
        tipoSelect.innerHTML = tipos.map(t => 
            `<option value="${t.codigo}">${t.nombre}</option>`
        ).join('');
    }
    
    // Cargar áreas
    const { data: areas } = await supabase
        .from('areas')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true});
    
    const areaSelect = document.getElementById('area');
    if (areaSelect && areas && areas.length > 0) {
        areaSelect.innerHTML = '<option value="">Seleccionar área</option>' + 
            areas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
    }
}

// ============================================
// EXPORTAR A EXCEL
// ============================================
async function exportToExcel() {
    if (allReports.length === 0) {
        alert('No hay reportes para exportar');
        return;
    }
    
    // Obtener tipos para formatear correctamente
    const { data: tipos } = await supabase
        .from('tipos_reporte')
        .select('codigo, nombre');
    
    const tiposMap = {};
    if (tipos) {
        tipos.forEach(t => {
            tiposMap[t.codigo] = t.nombre;
        });
    }
    
    // Crear CSV con separador de punto y coma (para Excel en español)
    const headers = ['Fecha', 'Centro', 'Reportado por', 'Tipo de Acción', 'Tipo', 'Área', 'Empleado', 'Descripción'];
    const rows = allReports.map(r => [
        new Date(r.created_at).toLocaleDateString('es-AR'),
        r.centro_productivo || '',
        r.reportado_por || '',
        r.tipo_accion === 'reconocimiento' ? 'Reconocimiento' : 'Llamado de Atención',
        tiposMap[r.tipo] || r.tipo.toUpperCase(),
        r.area,
        r.empleado,
        r.descripcion.replace(/"/g, '""').replace(/\n/g, ' ')
    ]);
    
    // Construir CSV con punto y coma
    let csv = headers.join(';') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(';') + '\n';
    });
    
    // Descargar archivo
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fecha = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes-safety-${fecha}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Exportados ${allReports.length} reportes a Excel`);
}


