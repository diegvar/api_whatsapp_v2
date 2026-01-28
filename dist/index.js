"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = require("dotenv");
const whatsapp_controller_1 = require("./controllers/whatsapp.controller");
const auth_middleware_1 = require("./middlewares/auth.middleware");
// Cargar variables de entorno
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
const whatsappController = new whatsapp_controller_1.WhatsAppController();
// Validar variables de entorno requeridas
if (!process.env.TOKEN_VAL) {
    console.warn('⚠️  ADVERTENCIA: TOKEN_VAL no está definido en las variables de entorno');
    console.warn('   La autenticación no funcionará correctamente');
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir archivos estáticos
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Ruta de health check (sin autenticación)
app.get('/health', (req, res) => {
    res.json({
        status: 200,
        message: 'API WhatsApp está funcionando',
        timestamp: new Date().toISOString()
    });
});
// Rutas de API (con autenticación)
app.post('/api/send-message', auth_middleware_1.verifyToken, (req, res) => whatsappController.sendMessage(req, res));
app.get('/api/status', auth_middleware_1.verifyToken, (req, res) => whatsappController.getStatus(req, res));
app.get('/api/qr-status', auth_middleware_1.verifyToken, (req, res) => whatsappController.getQRStatus(req, res));
app.post('/api/restart', auth_middleware_1.verifyToken, (req, res) => whatsappController.restartClient(req, res));
// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Ruta no encontrada',
        path: req.path
    });
});
// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        status: 500,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
    });
});
// Iniciar servidor
app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
    console.log(`📋 Health check disponible en http://localhost:${port}/health`);
    if (!process.env.TOKEN_VAL) {
        console.warn('⚠️  Recuerda configurar TOKEN_VAL en el archivo .env');
    }
});
