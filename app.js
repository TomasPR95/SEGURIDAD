// ============================================
// CONFIGURACIÓN SUPABASE
// ============================================
// IMPORTANTE: Cambia estos valores por los de tu proyecto
var SUPABASE_URL = 'https://dpzdlwwfvjoggejkaeiw.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwemRsd3dmdmpvZ2dlamthZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTQ1MTYsImV4cCI6MjA5MzU3MDUxNn0.2oSGq1RgelrXimeg8WuO6lc0RYUFeBq-5hWy3ZccN2c';

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadFormOptions();
    setupForm();
});

// ============================================
// CARGAR OPCIONES DEL FORMULARIO
// ============================================
async function loadFormOptions() {
    // Cargar tipos de reporte
    const { data: tipos, error: errorTipos } = await supabase
        .from('tipos_reporte')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });
    
    const tipoSelect = document.getElementById('tipo');
    if (tipos && tipos.length > 0) {
        tipoSelect.innerHTML = tipos.map(t => 
            `<option value="${t.codigo}">${t.nombre}</option>`
        ).join('');
    } else {
        tipoSelect.innerHTML = '<option value="">No hay tipos disponibles</option>';
    }
    
    // Cargar áreas
    const { data: areas, error: errorAreas } = await supabase
        .from('areas')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true});
    
    const areaSelect = document.getElementById('area');
    if (areas && areas.length > 0) {
        areaSelect.innerHTML = '<option value="">Seleccionar área</option>' + 
            areas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
    } else {
        areaSelect.innerHTML = '<option value="">No hay áreas disponibles</option>';
    }

    // Cargar centros productivos
    const { data: centros, error: errorCentros } = await supabase
        .from('centros_productivos')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true});
    
    const centroSelect = document.getElementById('centro_productivo');
    if (centros && centros.length > 0) {
        centroSelect.innerHTML = '<option value="">Seleccionar centro</option>' + 
            centros.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
    } else {
        centroSelect.innerHTML = '<option value="">No hay centros disponibles</option>';
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
        
        // Validar que todos los campos estén completos
        if (!report.tipo || !report.area || !report.empleado || !report.descripcion || !report.centro_productivo || !report.reportado_por) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('reportes')
                .insert([report]);
            
            if (error) {
                console.error('Error al guardar:', error);
                alert('Error al enviar el reporte: ' + error.message);
                return;
            }
            
            // Mostrar mensaje de éxito
            form.style.display = 'none';
            document.querySelector('.form-header').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar el reporte');
        }
    });
}

