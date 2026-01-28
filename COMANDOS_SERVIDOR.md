# Comandos Rápidos para el Servidor

## 🚀 Despliegue Inicial (Primera Vez)

```bash
# 1. Conectarse al servidor
ssh usuario@servidor

# 2. Clonar repositorio
cd /var/www  # o tu directorio preferido
git clone https://github.com/diegvar/api_whatsapp_v2.git
cd api_whatsapp_v2

# 3. Instalar dependencias
npm install

# 4. Configurar .env
nano .env
# Agregar: PORT=3002 y TOKEN_VAL=tu_token

# 5. Compilar (solo si dist/ NO está en el repo)
npm run build

# 6. Iniciar con PM2
pm2 start ecosystem.config.js

# 7. Configurar inicio automático
pm2 startup
pm2 save
```

## 🔄 Actualización (Cuando hay cambios)

### Opción Simple (Si dist/ está en el repo):
```bash
cd /ruta/al/proyecto/api_whatsapp_v2
git pull origin main
npm install  # Solo si hay cambios en package.json
pm2 restart whatsapp-api
pm2 logs whatsapp-api --lines 20
```

### Opción Completa (Si dist/ NO está en el repo):
```bash
cd /ruta/al/proyecto/api_whatsapp_v2
git pull origin main
npm install
npm run build
pm2 restart whatsapp-api
pm2 logs whatsapp-api --lines 20
```

## 📊 Comandos PM2 Esenciales

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs whatsapp-api

# Reiniciar
pm2 restart whatsapp-api

# Detener
pm2 stop whatsapp-api

# Eliminar
pm2 delete whatsapp-api

# Monitoreo
pm2 monit
```

## 🧪 Pruebas Rápidas

```bash
# Health check
curl http://localhost:3002/health

# Estado (requiere token)
curl -H "Authorization: tu_token" http://localhost:3002/api/status

# QR status
curl -H "Authorization: tu_token" http://localhost:3002/api/qr-status
```
