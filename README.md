# 🏭 SafetyTrack - Sistema con Usuarios y Administradores

Sistema web para reportar y gestionar actos inseguros, apercibimientos y fallas de calidad en plantas industriales.

**🔐 Versión con control de acceso: Operarios solo cargan, Administradores gestionan todo**

## 📁 Archivos del Proyecto

```
safety-track-v2/
├── index.html          # Página para OPERARIOS (solo formulario)
├── admin.html          # Página para ADMINISTRADORES (con login)
├── app.js             # Lógica para operarios
├── admin.js           # Lógica para administradores
├── styles.css         # Estilos compartidos
├── supabase-schema.sql # Script para la base de datos
└── README.md          # Este archivo
```

## 👥 Roles del Sistema

### 👷 **OPERARIOS** (index.html)
- Solo pueden CREAR reportes
- NO ven reportes de otros
- Acceso sin login
- URL: `https://tu-app.vercel.app/`

### 👔 **ADMINISTRADORES** (admin.html)
- Ven TODOS los reportes
- Dashboard con estadísticas
- Pueden cambiar estados
- Pueden ELIMINAR reportes
- Pueden crear reportes
- Acceso con LOGIN
- URL: `https://tu-app.vercel.app/admin.html`

## 🚀 Configuración Rápida

### 1️⃣ Configurar Supabase (5 minutos)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - Nombre: `safety-track`
   - Contraseña: guárdala bien
   - Región: South America (São Paulo)
3. Espera 2-3 minutos
4. Ve a **SQL Editor** → **+ New Query**
5. Copia y pega TODO el contenido de `supabase-schema.sql`
6. Click en **RUN**
7. Ve a **Settings** → **API**:
   - Copia la **Project URL**
   - Copia la **anon public key**

### 2️⃣ Configurar Credenciales (2 minutos)

#### A) Configurar Supabase en AMBOS archivos:

**En `app.js` (líneas 5-6):**
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

**En `admin.js` (líneas 4-5):**
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
```

#### B) Configurar usuarios admin:

**En `admin.js` (líneas 11-14):**
```javascript
const ADMIN_USERS = {
    'admin': 'admin123',          // Cambia este password
    'supervisor': 'supervisor123', // Cambia este password
    'tu_usuario': 'tu_password'   // Agrega más usuarios aquí
};
```

### 3️⃣ Subir a GitHub + Vercel (5 minutos)

#### Opción A: GitHub Desktop (Más Fácil)

1. Descarga [GitHub Desktop](https://desktop.github.com/)
2. File → Add Local Repository
3. Selecciona la carpeta `safety-track-v2`
4. Commit: "Sistema SafetyTrack con roles"
5. **Publish repository**

Luego en [vercel.com](https://vercel.com):
1. Login con GitHub
2. **Add New** → **Project**
3. Selecciona `safety-track-v2`
4. **Deploy**

#### Opción B: Terminal con Git

```bash
cd safety-track-v2
git init
git add .
git commit -m "Sistema SafetyTrack con roles"

# Crea repo en github.com llamado "safety-track"
git remote add origin https://github.com/TU_USUARIO/safety-track.git
git branch -M main
git push -u origin main

# Luego despliega en Vercel desde su web
```

## 🎯 URLs de tu Aplicación

Una vez desplegado en Vercel:

- **Para OPERARIOS:** `https://tu-app.vercel.app/`
- **Para ADMINS:** `https://tu-app.vercel.app/admin.html`

## 📱 Instrucciones de Uso

### Para Operarios (Personal de Planta)

1. Abre `https://tu-app.vercel.app/`
2. Completa el formulario:
   - Tipo de reporte
   - Área (selector)
   - Empleado involucrado
   - Gravedad
   - Descripción
3. Click en **Enviar Reporte**
4. ¡Listo! Aparece mensaje de confirmación

### Para Administradores

1. Abre `https://tu-app.vercel.app/admin.html`
2. **Login:**
   - Usuario: `admin`
   - Contraseña: `admin123` (o la que configuraste)
3. Accedes al **Dashboard** con:
   - Estadísticas en tiempo real
   - Todos los reportes
   - Filtros por tipo
   - Cambiar estados
   - **Botón eliminar** en cada reporte
4. Para cerrar sesión: Click en **Cerrar Sesión**

## 🔧 Personalización

### Agregar más usuarios admin

Edita `admin.js` líneas 11-14:

```javascript
const ADMIN_USERS = {
    'admin': 'admin123',
    'supervisor': 'supervisor123',
    'jefe_planta': 'password456',
    'recursos_humanos': 'rrhh2024',
    // Agrega todos los que necesites
};
```

### Cambiar áreas disponibles

Edita `index.html` y `admin.html` en las líneas del selector de área:

```html
<select id="area" name="area" required>
    <option value="">Seleccionar área</option>
    <option value="TU ÁREA 1">TU ÁREA 1</option>
    <option value="TU ÁREA 2">TU ÁREA 2</option>
    <!-- Agrega las áreas de tu planta -->
</select>
```

### Personalizar colores

Edita `styles.css` líneas 1-12:

```css
:root {
  --color-danger: #E63946;   /* Rojo para alertas */
  --color-warning: #F77F00;  /* Naranja para advertencias */
  --color-success: #06D6A0;  /* Verde para completados */
  --color-primary: #118AB2;  /* Azul principal */
}
```

### Cambiar logo

En `index.html` línea 17 y `admin.html` línea 25:

```html
<!-- Reemplaza el emoji por tu logo -->
<div class="logo-icon">
  <img src="logo.png" alt="Logo" style="height: 40px;">
</div>
```

## 🔒 Seguridad

### ⚠️ IMPORTANTE para Producción

La configuración actual usa contraseñas en el código JavaScript. Esto es **aceptable para uso interno** en una red corporativa, pero para mayor seguridad considera:

#### Opción 1: Supabase Auth (Recomendado)

Reemplaza el sistema de login simple por autenticación real:

```javascript
// En admin.js
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@tuempresa.com',
  password: 'password'
})
```

Requiere configurar usuarios en Supabase → Authentication.

#### Opción 2: Cambiar contraseñas periódicamente

Si usas el sistema actual:
1. Cambia las contraseñas cada 3 meses
2. No uses contraseñas obvias como "admin123"
3. Mantén el archivo `admin.js` fuera de repositorios públicos

### Restringir acceso a Supabase

Por defecto, cualquiera puede insertar reportes (necesario para operarios). Si quieres que SOLO los admins puedan ver/editar/eliminar:

```sql
-- En Supabase SQL Editor:

-- Permitir INSERT a todos (para formulario de operarios)
CREATE POLICY "Anyone can insert" ON reportes
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados pueden ver/editar/eliminar
CREATE POLICY "Only authenticated can read" ON reportes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated can update" ON reportes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated can delete" ON reportes
  FOR DELETE USING (auth.role() = 'authenticated');
```

Luego implementa Supabase Auth en el panel admin.

## 🐛 Solución de Problemas

### No puedo iniciar sesión en admin
- Verifica que el usuario y contraseña sean correctos en `admin.js`
- Abre la consola (F12) y revisa errores
- Intenta con: usuario `admin` y password `admin123`

### Los operarios no pueden enviar reportes
- Revisa que las credenciales de Supabase estén en `app.js`
- Verifica que el schema SQL se haya ejecutado correctamente
- Abre consola (F12) y mira errores

### Los cambios no se reflejan en Vercel
1. Haz commit de los cambios en GitHub
2. Vercel redespliega automáticamente
3. Si no, en Vercel → tu proyecto → Deployments → Redeploy

### Error "Cannot read property 'createClient'"
- El CDN de Supabase no cargó
- Verifica tu conexión a internet
- Asegúrate de que el HTML incluya: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

## 📊 Funcionalidades Avanzadas (Próximamente)

Ideas para expandir el sistema:

- [ ] Exportar reportes a Excel/PDF
- [ ] Subir fotos de evidencia
- [ ] Gráficos de tendencias
- [ ] Notificaciones por email a supervisores
- [ ] Historial de cambios de cada reporte
- [ ] Asignar responsables a reportes
- [ ] Reportes anónimos (opcional)
- [ ] App móvil con React Native

## 💡 Ventajas de Esta Versión

✅ **Separación de roles**: Operarios vs Administradores  
✅ **Sin Node.js**: HTML + JavaScript puro  
✅ **Login simple**: Sin backend complejo  
✅ **Gratis**: Supabase + Vercel + GitHub  
✅ **Tiempo real**: Cambios se ven al instante  
✅ **Responsive**: Funciona en celular y tablet  

## 📞 Soporte

Si necesitas ayuda:
1. Revisa este README completo
2. Verifica las credenciales en `app.js` y `admin.js`
3. Chequea que el schema SQL esté ejecutado
4. Revisa la consola del navegador (F12)

---

**¡Sistema listo para mejorar la seguridad en tu planta! 🏭⚠️**

**Usuarios por defecto:**
- Usuario: `admin` / Contraseña: `admin123`
- Usuario: `supervisor` / Contraseña: `supervisor123`

**⚠️ ¡Cambia estas contraseñas antes de usar en producción!**
