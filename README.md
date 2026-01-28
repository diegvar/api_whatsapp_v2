# API WhatsApp Web

API REST para enviar mensajes de WhatsApp utilizando whatsapp-web.js. Esta API permite la integración de WhatsApp en aplicaciones web o móviles mediante una interfaz REST.

## Requisitos

- Node.js v18 o superior
- npm o yarn
- Navegador Chrome o Chromium instalado
- Cuenta de WhatsApp activa

## Instalación

1. Clonar el repositorio
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

4. Compilar TypeScript:
```bash
npm run build
```

## Uso

1. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

2. Al iniciar, se generará un código QR en `public/qr.png` (disponible en `http://localhost:3002/qr.png`). Escanea este código con WhatsApp en tu teléfono.

3. Verifica el estado antes de enviar mensajes:
```http
GET /api/status
Authorization: tu_token_secreto_aqui
```

4. Una vez autenticado (estado "conectado"), puedes usar las siguientes rutas:

### Enviar mensaje
```http
POST /api/send-message
Authorization: tu_token_secreto_aqui
Content-Type: application/json

{
    "phoneNumber": "521234567890",
    "message": "Hola, este es un mensaje de prueba"
}
```

### Verificar estado
```http
GET /api/status
Authorization: tu_token_secreto_aqui
```

### Verificar QR
```http
GET /api/qr-status
Authorization: tu_token_secreto_aqui
```

### Reiniciar cliente
```http
POST /api/restart
Authorization: tu_token_secreto_aqui
```

## Endpoints Disponibles

- `GET /health` - Health check (sin autenticación)
- `POST /api/send-message` - Enviar mensaje de WhatsApp
- `GET /api/status` - Verificar estado de conexión
- `GET /api/qr-status` - Verificar si hay código QR disponible
- `POST /api/restart` - Reiniciar el cliente de WhatsApp

## Notas importantes

- El número de teléfono debe incluir el código de país (por ejemplo, "521234567890" para México)
- La primera vez que inicies la aplicación, necesitarás escanear el código QR
- La sesión se guardará localmente en `.wwebjs_auth`, por lo que no necesitarás escanear el código QR cada vez
- **Siempre verifica el estado con `GET /api/status` antes de enviar mensajes**
- Si el estado es "desconectado", verifica si hay QR disponible y escanéalo
- Asegúrate de que el servidor tenga acceso a Chrome/Chromium para que whatsapp-web.js funcione correctamente

## Características

- ✅ Verificación de estado mejorada
- ✅ Espera automática hasta que el cliente esté listo
- ✅ Manejo robusto de errores
- ✅ Reinicio automático en caso de errores de QR
- ✅ Mensajes de error descriptivos
- ✅ Autenticación basada en tokens

## Documentación Completa

Para más detalles, consulta [DOCUMENTATION.md](./DOCUMENTATION.md) y [SOLUCION_ERROR.md](./SOLUCION_ERROR.md) 