// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'https://dpzdlwwfvjoggejkaeiw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwemRsd3dmdmpvZ2dlamthZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTQ1MTYsImV4cCI6MjA5MzU3MDUxNn0.2oSGq1RgelrXimeg8WuO6lc0RYUFeBq-5hWy3ZccN2c';

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

