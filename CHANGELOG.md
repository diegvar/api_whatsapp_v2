# Changelog

## [Actualización de Paquetes] - 2026-06-14

### 📦 Paquetes Actualizados

#### Dependencias Principales
- **whatsapp-web.js**: `1.34.6` → `1.34.7` ⬆️
  - Última versión estable
  - Eliminada opción deprecada `restartOnAuthFail`

- **puppeteer**: `24.36.1` → `24.43.1` ⬆️
  - Correcciones de seguridad y compatibilidad con Chrome reciente

- **express**: `4.22.1` → `4.22.2` ⬆️
  - Parches de seguridad en dependencias transitivas

- **dotenv**: `16.4.7` → `16.6.1` ⬆️
- **qrcode**: `1.5.3` → `1.5.4` ⬆️

#### Dependencias de Desarrollo
- **@types/cors**: `2.8.17` → `2.8.19` ⬆️
- **@types/node**: `20.19.30` → `20.19.43` ⬆️
- **typescript**: `5.7.3` → `5.9.3` ⬆️

### 🔧 Cambios en el Código
- **webVersionCache**: actualizado de `2.2413.54` a `2.3000.1041431076-alpha` (versión estable de junio 2026)
- **Página QR** (`public/index.html`): corregida para verificar `/qr.png` sin requerir token de autenticación
- **Nueva ruta pública**: `GET /qr-status` (sin autenticación, para la página de escaneo)

### 🔒 Seguridad
- ✅ 0 vulnerabilidades tras `npm audit fix`

### ⚠️ Notas Importantes
- **Express 5.x**, **TypeScript 6.x**, **dotenv 17.x** y **@types/node 25.x** no se actualizaron para evitar cambios mayores

### ✅ Verificación
- ✅ Compilación TypeScript exitosa
- ✅ Dependencias instaladas correctamente

---

## [Actualización de Paquetes] - 2026-01-28

### 📦 Paquetes Actualizados

#### Dependencias Principales
- **whatsapp-web.js**: `1.34.1` → `1.34.4` ⬆️
  - Actualización a la última versión estable
  - Mejoras en estabilidad y compatibilidad con WhatsApp Web

- **puppeteer**: `24.23.0` → `24.36.1` ⬆️
  - Actualización mayor con mejoras de rendimiento
  - Soporte para Chrome 144.0.7559.96
  - Correcciones de seguridad

- **express**: `4.18.2` → `4.22.1` ⬆️
  - Actualización dentro de la rama 4.x
  - Mejoras de seguridad y rendimiento

- **cors**: `2.8.5` → `2.8.6` ⬆️
  - Corrección de bugs menores

- **dotenv**: `16.3.1` → `16.4.7` ⬆️
  - Actualización dentro de la rama 16.x
  - Mejoras de compatibilidad

#### Dependencias de Desarrollo
- **@types/express**: `4.17.21` → `4.17.25` ⬆️
- **@types/node**: `20.10.5` → `20.19.30` ⬆️
- **@types/qrcode**: `1.5.5` → `1.5.6` ⬆️
- **typescript**: `5.3.3` → `5.7.3` ⬆️

### 🔒 Seguridad
- ✅ Todas las vulnerabilidades corregidas mediante `npm audit fix`
- ✅ 0 vulnerabilidades encontradas después de la actualización
- ✅ Dependencias transitivas actualizadas automáticamente

### ⚠️ Notas Importantes
- **Express 5.x**: No se actualizó a la versión 5.x ya que requiere cambios mayores en el código
- **Node Types 25.x**: No se actualizó a la versión 25.x para mantener compatibilidad con Node.js 20.x
- **dotenv 17.x**: No se actualizó a la versión 17.x para mantener compatibilidad

### ✅ Verificación
- ✅ Compilación TypeScript exitosa
- ✅ Todas las dependencias instaladas correctamente
- ✅ Sin vulnerabilidades de seguridad
- ✅ Código compilado y listo para producción

### 📝 Próximos Pasos Recomendados
1. Probar la aplicación en desarrollo
2. Verificar que todas las funcionalidades sigan funcionando
3. Monitorear logs para detectar posibles problemas
4. Considerar actualizar a Express 5.x y Node Types 25.x en el futuro cuando sea necesario

---

## [Mejoras de Código] - 2026-01-28

### ✨ Nuevas Características
- Endpoint `/health` para health checks
- Manejo global de errores
- Validación mejorada de variables de entorno
- Mejoras en el manejo de errores en controladores

### 🐛 Correcciones
- Typo corregido en `auth.middleware.ts` (authorzationHeader)
- Validación de TOKEN_VAL antes de usarlo
- Validación de mensajes vacíos

### 📚 Documentación
- Documentación actualizada con nuevos endpoints
- Guías de solución de problemas mejoradas
- README actualizado con información completa
