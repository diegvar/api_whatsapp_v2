# Ejecutar en local para pruebas

## Requisitos

- **Node.js** >= 18 ([descargar](https://nodejs.org/))
- **npm** (viene con Node.js)

## Pasos rápidos

### 1. Instalar dependencias

```bash
cd api_whatsapp_v2
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo:

```bash
# Windows (PowerShell)
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edita `.env` y pon tu token (cualquier string para pruebas):

```
PORT=3002
TOKEN_VAL=mi_token_de_prueba
NODE_ENV=development
```

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

Con esto:
- El servidor arranca en **http://localhost:3002**
- Se recargan los cambios al guardar (ts-node-dev)
- Verás los logs en la consola

### 4. Primera vez: escanear QR

1. Al iniciar se generará un QR en `public/qr.png`
2. Abre en el navegador: **http://localhost:3002/qr.png**
3. Escanea el QR con WhatsApp en tu teléfono (Ajustes → Dispositivos vinculados → Vincular dispositivo)
4. Cuando veas "Cliente WhatsApp está listo!" ya puedes probar la API

### 5. Probar la API

**Health check (sin token):**
```bash
curl http://localhost:3002/health
```

**Estado (con token):**
```bash
curl -H "Authorization: mi_token_de_prueba" http://localhost:3002/api/status
```

**Enviar mensaje:**
```bash
curl -X POST http://localhost:3002/api/send-message ^
  -H "Authorization: mi_token_de_prueba" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"521234567890\", \"message\": \"Hola desde local\"}"
```

En Linux/Mac quita los `^` y usa una sola línea o `\` para continuar.

**QR status:**
```bash
curl -H "Authorization: mi_token_de_prueba" http://localhost:3002/api/qr-status
```

## Alternativa: ejecutar compilado

```bash
npm run build
npm start
```

## Notas

- La sesión se guarda en `.wwebjs_auth`; no tendrás que escanear el QR cada vez.
- Para "desvincular" y probar de nuevo: borra la carpeta `.wwebjs_auth` y reinicia.
- En local, Puppeteer puede abrir una ventana de Chrome; es normal. Si quieres sin ventana, el código ya usa `headless: true`.
