# API WhatsApp Web

Esta API permite enviar mensajes de WhatsApp utilizando whatsapp-web.js.

## Requisitos

- Node.js v18 o superior
- npm o yarn
- Navegador Chrome o Chromium instalado

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

## Uso

1. Iniciar el servidor:
```bash
npm start
```

2. Al iniciar, se mostrará un código QR en la consola. Escanea este código con WhatsApp en tu teléfono.

3. Una vez autenticado, puedes usar las siguientes rutas:

### Enviar mensaje
```http
POST /api/send-message
Content-Type: application/json

{
    "number": "1234567890",
    "message": "Hola, este es un mensaje de prueba"
}
```

### Verificar estado
```http
GET /api/status
```

## Notas importantes

- El número de teléfono debe incluir el código de país (por ejemplo, "521234567890" para México)
- La primera vez que inicies la aplicación, necesitarás escanear el código QR
- La sesión se guardará localmente, por lo que no necesitarás escanear el código QR cada vez
- Asegúrate de que el servidor tenga acceso a Chrome/Chromium para que whatsapp-web.js funcione correctamente 