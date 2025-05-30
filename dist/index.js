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
const port = process.env.PORT || 3000;
const whatsappController = new whatsapp_controller_1.WhatsAppController();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir archivos estáticos
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Rutas
app.post('/api/send-message', auth_middleware_1.verifyToken, (req, res) => whatsappController.sendMessage(req, res));
app.get('/api/status', auth_middleware_1.verifyToken, (req, res) => whatsappController.getStatus(req, res));
app.get('/api/qr-status', auth_middleware_1.verifyToken, (req, res) => whatsappController.getQRStatus(req, res));
// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
