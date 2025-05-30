# Documentación API WhatsApp Web

## Descripción
API REST para enviar mensajes de WhatsApp utilizando whatsapp-web.js. Esta API permite la integración de WhatsApp en aplicaciones web o móviles mediante una interfaz REST.

## Requisitos
- Node.js v18 o superior
- NPM o Yarn
- Chrome o Chromium instalado
- Cuenta de WhatsApp activa

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
- 400: Número o mensaje faltante
- 402: Token no enviado
- 403: Token inválido
- 500: Error interno del servidor

### 2. Verificar Estado
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

### 3. Verificar QR
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
2. Escanea el código QR con WhatsApp en tu teléfono
3. La sesión se guardará localmente en `.wwebjs_auth`
4. No necesitarás escanear el código QR nuevamente hasta que:
   - Se elimine la carpeta `.wwebjs_auth`
   - Se cierre la sesión desde WhatsApp

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
1. Elimina la carpeta `.wwebjs_auth`
2. Reinicia la aplicación
3. Escanea el código QR nuevamente

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
```

## Contribución
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT. 