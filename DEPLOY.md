# Guía de Despliegue en Servidor

Esta guía te ayudará a desplegar la API de WhatsApp en un servidor Linux usando PM2.

## 📋 Requisitos Previos

- Servidor Linux (Ubuntu/Debian recomendado)
- Node.js v18 o superior instalado
- Git instalado
- PM2 instalado globalmente
- Acceso SSH al servidor
- Cuenta de GitHub con acceso al repositorio

## 🚀 Paso a Paso

### 1. Conectarse al Servidor

```bash
ssh usuario@tu-servidor.com
```

### 2. Instalar Node.js (si no está instalado)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js v20 (recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 3. Instalar PM2 Globalmente

```bash
sudo npm install -g pm2
```

### 4. Instalar Git (si no está instalado)

```bash
sudo apt install git -y
```

### 5. Clonar o Actualizar el Repositorio

#### Si es la primera vez (clonar):
```bash
# Navegar al directorio donde quieres el proyecto (ej: /var/www o /home/usuario)
cd /var/www  # o el directorio que prefieras

# Clonar el repositorio
git clone https://github.com/diegvar/api_whatsapp_v2.git

# Entrar al directorio
cd api_whatsapp_v2
```

#### Si ya existe el repositorio (actualizar):
```bash
cd /ruta/al/proyecto/api_whatsapp_v2
git pull origin main
```

### 6. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Esto instalará automáticamente Chrome/Chromium a través de Puppeteer
```

### 7. Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Agregar el siguiente contenido:
```env
PORT=3002
TOKEN_VAL=tu_token_secreto_muy_seguro_aqui
NODE_ENV=production
```

**Importante:**
- Cambia `tu_token_secreto_muy_seguro_aqui` por un token seguro y único
- Guarda el archivo: `Ctrl + O`, luego `Enter`, luego `Ctrl + X`

### 8. Compilar el Proyecto

**Nota:** Si `dist/` está incluido en el repositorio, puedes saltar este paso y usar directamente los archivos compilados.

```bash
# Compilar TypeScript a JavaScript
npm run build
```

Esto generará los archivos compilados en la carpeta `dist/`.

### 9. Verificar que los Archivos Están Listos

```bash
# Verificar que existe dist/index.js
ls -la dist/

# Deberías ver:
# - dist/index.js
# - dist/controllers/
# - dist/services/
# - dist/middlewares/
# - dist/types/
```

Si `dist/` está en el repositorio, estos archivos ya deberían existir después del `git clone` o `git pull`.

### 10. Iniciar con PM2

#### Opción A: Inicio Básico
```bash
pm2 start dist/index.js --name whatsapp-api
```

#### Opción B: Inicio con Configuración (Recomendado)
```bash
pm2 start dist/index.js --name whatsapp-api --log-date-format "YYYY-MM-DD HH:mm:ss Z"
```

#### Opción C: Con Archivo de Configuración PM2 (Más Profesional)

Crear archivo `ecosystem.config.js`:
```bash
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-api',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Luego iniciar:
```bash
pm2 start ecosystem.config.js
```

### 11. Configurar PM2 para Inicio Automático

```bash
# Generar script de inicio automático
pm2 startup

# Seguir las instrucciones que aparecen (generalmente copiar y pegar un comando sudo)

# Guardar la configuración actual de PM2
pm2 save
```

### 12. Verificar que Está Funcionando

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs whatsapp-api

# Ver solo errores
pm2 logs whatsapp-api --err

# Ver información detallada
pm2 info whatsapp-api
```

### 13. Probar la API

```bash
# Health check (sin autenticación)
curl http://localhost:3002/health

# Verificar estado (requiere token)
curl -H "Authorization: tu_token_secreto" http://localhost:3002/api/status
```

## 🔧 Comandos Útiles de PM2

### Gestión Básica
```bash
# Ver todos los procesos
pm2 list

# Detener la aplicación
pm2 stop whatsapp-api

# Reiniciar la aplicación
pm2 restart whatsapp-api

# Eliminar de PM2
pm2 delete whatsapp-api

# Ver logs
pm2 logs whatsapp-api

# Ver logs de las últimas 100 líneas
pm2 logs whatsapp-api --lines 100

# Limpiar logs
pm2 flush
```

### Monitoreo
```bash
# Monitor en tiempo real
pm2 monit

# Ver información detallada
pm2 show whatsapp-api
```

### Actualización del Código

Cuando necesites actualizar el código:

#### Opción A: Si dist/ está en el repositorio (Más Simple)
```bash
# 1. Ir al directorio del proyecto
cd /ruta/al/proyecto/api_whatsapp_v2

# 2. Obtener los últimos cambios (incluye archivos compilados)
git pull origin main

# 3. Instalar nuevas dependencias (solo si hay cambios en package.json)
npm install

# 4. Reiniciar PM2
pm2 restart whatsapp-api

# 5. Verificar logs
pm2 logs whatsapp-api --lines 50
```

#### Opción B: Si dist/ NO está en el repositorio (Mejor Práctica)
```bash
# 1. Ir al directorio del proyecto
cd /ruta/al/proyecto/api_whatsapp_v2

# 2. Obtener los últimos cambios
git pull origin main

# 3. Instalar nuevas dependencias (si hay)
npm install

# 4. Recompilar
npm run build

# 5. Reiniciar PM2
pm2 restart whatsapp-api

# 6. Verificar logs
pm2 logs whatsapp-api --lines 50
```

**Nota:** La Opción A es más rápida pero incluye archivos compilados en git. La Opción B es mejor práctica pero requiere compilar en el servidor.

## 🔒 Configuración de Firewall (si es necesario)

Si usas un firewall, abre el puerto:

```bash
# UFW (Ubuntu)
sudo ufw allow 3002/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

## 🌐 Configuración con Nginx (Opcional - Para Producción)

Si quieres usar Nginx como proxy reverso:

```bash
# Instalar Nginx
sudo apt install nginx -y

# Crear configuración
sudo nano /etc/nginx/sites-available/whatsapp-api
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📝 Verificación Final

1. **Verificar que PM2 está corriendo:**
   ```bash
   pm2 status
   ```

2. **Verificar que la API responde:**
   ```bash
   curl http://localhost:3002/health
   ```

3. **Verificar logs:**
   ```bash
   pm2 logs whatsapp-api --lines 20
   ```

4. **Verificar que el QR se genera (si es necesario):**
   - Esperar unos segundos después del inicio
   - Verificar que existe `public/qr.png` o usar el endpoint `/api/qr-status`

## ⚠️ Solución de Problemas

### Si PM2 no inicia la aplicación:
```bash
# Ver logs de errores
pm2 logs whatsapp-api --err

# Verificar que el archivo existe
ls -la dist/index.js

# Verificar permisos
chmod +x dist/index.js
```

### Si hay problemas de permisos:
```bash
# Dar permisos al usuario
sudo chown -R $USER:$USER /ruta/al/proyecto
```

### Si el puerto está en uso:
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3002

# O usar netstat
sudo netstat -tulpn | grep 3002
```

### Si hay problemas con Puppeteer/Chrome:
```bash
# Instalar dependencias del sistema
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

## 📊 Monitoreo Continuo

Para monitorear el rendimiento:

```bash
# Ver uso de recursos
pm2 monit

# Ver métricas
pm2 show whatsapp-api
```

## ✅ Checklist de Despliegue

- [ ] Node.js v18+ instalado
- [ ] PM2 instalado globalmente
- [ ] Repositorio clonado/actualizado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado
- [ ] Proyecto compilado (`npm run build`)
- [ ] Aplicación iniciada con PM2
- [ ] PM2 configurado para inicio automático
- [ ] Health check funcionando
- [ ] Logs verificados
- [ ] Firewall configurado (si es necesario)

## 🎉 ¡Listo!

Tu API de WhatsApp debería estar funcionando en el servidor. Recuerda:

- El código QR se generará en `public/qr.png` cuando sea necesario
- Los logs están disponibles con `pm2 logs whatsapp-api`
- Para actualizar, usa `git pull` + `npm install` + `npm run build` + `pm2 restart`
