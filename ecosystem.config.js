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
    merge_logs: true,
    // Opciones adicionales para mejor estabilidad
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Variables de entorno específicas (se pueden sobrescribir con .env)
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
