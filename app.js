// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupForm();
});

// ============================================
// CONFIGURAR FORMULARIO
// ============================================
function setupForm() {
    const form = document.getElementById('report-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Deshabilitar botón para evitar doble envío
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
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
                alert('❌ Error al crear reporte: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Reporte';
                return;
            }
            
            // Mostrar mensaje de éxito
            form.style.display = 'none';
            document.querySelector('.form-header').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error de conexión. Por favor, intenta nuevamente.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Reporte';
        }
    });
}
