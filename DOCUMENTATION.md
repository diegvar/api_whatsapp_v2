# Documentación API WhatsApp Web

## Descripción
API REST para enviar mensajes de WhatsApp utilizando whatsapp-web.js. Esta API permite la integración de WhatsApp en aplicaciones web o móviles mediante una interfaz REST.

## Requisitos
- Node.js v18 o superior
- NPM o Yarn
- Chrome o Chromium instalado (se descarga automáticamente con Puppeteer)
- Cuenta de WhatsApp activa

## Versiones de Paquetes Principales
- **whatsapp-web.js**: ^1.34.4 (última versión estable)
- **puppeteer**: ^24.36.1 (última versión estable)
- **express**: ^4.22.1
- **typescript**: ^5.7.3

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/diegvar/api_whatsapp_v2.git
cd api_whatsapp_v2
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crear archivo `.env` en la raíz del proyecto:
```
PORT=3002
TOKEN_VAL=tu_token_secreto_aqui
```

## Estructura del Proyecto
```
src/
  ├── config/          # Configuraciones
  ├── controllers/     # Controladores de la API
  ├── middlewares/     # Middlewares (autenticación)
  ├── services/        # Lógica de negocio
  ├── types/          # Definiciones de tipos TypeScript
  └── index.ts        # Punto de entrada
```

## Endpoints

### 0. Health Check
```http
GET /health
```

**Sin autenticación requerida**

**Respuesta Exitosa (200):**
```json
{
    "status": 200,
    "message": "API WhatsApp está funcionando",
    "timestamp": "2026-01-28T10:30:00.000Z"
}
```

**Uso:** Útil para verificar que el servidor está funcionando y para monitoreo.

### 1. Enviar Mensaje
```http
POST /api/send-message
```

**Headers:**
```
Authorization: tu_token_secreto_aqui
Content-Type: application/json
```

**Body:**
```json
{
    "phoneNumber": "521234567890",
    "message": "Hola, este es un mensaje de prueba"
}
```

**Respuesta Exitosa (200):**
```json
{
    "status": 200,
    "message": "El mensaje se ha enviado con éxito",
    "data": {
        // Información del mensaje enviado
    }
}
```

**Errores:**
- **400**: Número de teléfono inválido o formato incorrecto
- **401**: Sesión no autorizada (requiere escanear QR)
- **402**: Token no enviado
- **403**: Token inválido
- **503**: Cliente no conectado o no autenticado
  - El cliente no está listo para enviar mensajes
  - Requiere escanear el código QR primero
  - El cliente perdió la conexión
- **500**: Error interno del servidor

### 2. Verificar Estado de Conexión
```http
GET /api/status
```

**Headers:**
```
Authorization: tu_token_secreto_aqui
```

**Respuesta Exitosa (200):**
```json
{
    "status": 200,
    "success": true,
    "connectionStatus": "conectado"
}
```

**Nota:** El estado puede ser:
- `"conectado"`: Cliente listo y autenticado, puedes enviar mensajes
- `"desconectado"`: Cliente no está listo, verifica si hay QR disponible

### 3. Verificar Estado del QR
```http
GET /api/qr-status
```

**Headers:**
```
Authorization: tu_token_secreto_aqui
```

**Respuesta Exitosa (200):**
```json
{
    "status": 200,
    "success": true,
    "hasQR": true
}
```

**Nota:** Si `hasQR` es `true`, hay un código QR disponible en `http://localhost:3002/qr.png` que debes escanear con WhatsApp.

### 5. Reiniciar Cliente
```http
POST /api/restart
```

**Headers:**
```
Authorization: tu_token_secreto_aqui
```

**Respuesta Exitosa (200):**
```json
{
    "status": 200,
    "success": true,
    "message": "Cliente de WhatsApp reiniciado correctamente"
}
```

**Uso:** Útil cuando el cliente está en un estado de error o necesita reconectarse.

## Autenticación

La API utiliza un sistema de autenticación basado en tokens. Para usar la API:

1. Configura el token en el archivo `.env`:
```
TOKEN_VAL=tu_token_secreto_aqui
```

2. Incluye el token en todas las peticiones en el header:
```
Authorization: tu_token_secreto_aqui
```

## Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
# Compilar TypeScript
npm run build

# Iniciar con Node
npm start

# O con PM2
pm2 start dist/index.js --name "whatsapp-api"
```

## Manejo de Sesión

1. Al iniciar la aplicación, se generará un código QR
2. El QR se guarda en `public/qr.png` y está disponible en `http://localhost:3002/qr.png`
3. Escanea el código QR con WhatsApp en tu teléfono
4. La sesión se guardará localmente en `.wwebjs_auth`
5. No necesitarás escanear el código QR nuevamente hasta que:
   - Se elimine la carpeta `.wwebjs_auth`
   - Se cierre la sesión desde WhatsApp
   - Haya un error de autenticación

**Importante:** 
- Siempre verifica el estado con `GET /api/status` antes de enviar mensajes
- Si el estado es "desconectado", verifica si hay QR disponible con `GET /api/qr-status`
- El sistema espera automáticamente hasta 30 segundos a que el cliente esté listo antes de enviar mensajes

## Consideraciones de Seguridad

1. **Token de Autenticación**
   - Mantén el token seguro y no lo compartas
   - Usa un token fuerte y único
   - Cambia el token periódicamente

2. **Números de Teléfono**
   - Siempre incluye el código de país
   - Elimina caracteres especiales
   - Verifica el formato antes de enviar

3. **Mensajes**
   - Sanitiza el contenido de los mensajes
   - Limita la longitud de los mensajes
   - Valida el contenido antes de enviar

## Solución de Problemas

### Error de Puerto en Uso
Si el puerto 3000 está en uso:
1. Cambia el puerto en `.env`
2. O mata el proceso que usa el puerto:
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### Error de Autenticación
Si hay problemas con la autenticación:
1. Verifica el estado con `GET /api/status`
2. Si está desconectado, verifica si hay QR con `GET /api/qr-status`
3. Si no hay QR, elimina la carpeta `.wwebjs_auth`
4. Reinicia la aplicación con `POST /api/restart` o reinicia el servidor
5. Escanea el código QR nuevamente

### Error "Cannot read properties of undefined (reading 'getChat')"
Este error indica que intentaste enviar un mensaje antes de que el cliente esté autenticado:
1. Verifica el estado con `GET /api/status`
2. Si está "desconectado", espera a que se autentique
3. Escanea el QR si está disponible
4. Espera a que el estado cambie a "conectado" antes de enviar mensajes

### Error "Max qrcode retries reached"
Este error indica que WhatsApp no pudo generar el QR después de múltiples intentos:
1. El sistema intentará reiniciar automáticamente después de 5 segundos
2. Si persiste, elimina la carpeta `.wwebjs_auth`
3. Reinicia el servidor
4. Verifica la conectividad a internet

### Error de Chrome/Chromium
Si hay problemas con el navegador:
1. Asegúrate de tener Chrome/Chromium instalado
2. Verifica los permisos de ejecución
3. Revisa los logs de PM2 para más detalles

## Mantenimiento

### Logs
```bash
# Ver logs en tiempo real
pm2 logs whatsapp-api

# Ver logs de errores
pm2 logs whatsapp-api --err
```

### Reinicio
```bash
# Reiniciar la aplicación
pm2 restart whatsapp-api

# Reiniciar con limpieza de logs
pm2 flush whatsapp-api

# O usar el endpoint de reinicio
POST /api/restart
```

## Mejoras Recientes

### Verificación de Estado Mejorada
- El sistema ahora verifica que el cliente esté completamente listo y autenticado antes de enviar mensajes
- Espera automática de hasta 30 segundos para que el cliente esté listo
- Seguimiento de estado con variables `isReady` e `isAuthenticated`

### Manejo de Errores Mejorado
- Detección específica de errores comunes (`getChat`, `sendSeen`, `not-authorized`)
- Mensajes de error más descriptivos
- Códigos de estado HTTP apropiados

### Configuración Optimizada
- `qrMaxRetries` aumentado a 10 intentos
- `authTimeoutMs` aumentado a 10 minutos
- Reinicio automático cuando se alcanza el límite de QR retries

## Contribución
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT. 