import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from 'dotenv';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { verifyToken } from './middlewares/auth.middleware';

// Cargar variables de entorno
config();

const app = express();
const port = process.env.PORT || 3002;
const whatsappController = new WhatsAppController();

// Validar variables de entorno requeridas
if (!process.env.TOKEN_VAL) {
    console.warn('⚠️  ADVERTENCIA: TOKEN_VAL no está definido en las variables de entorno');
    console.warn('   La autenticación no funcionará correctamente');
}

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta de health check (sin autenticación)
app.get('/health', (req, res) => {
    res.json({
        status: 200,
        message: 'API WhatsApp está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rutas de API (con autenticación)
app.post('/api/send-message', verifyToken, (req, res) => whatsappController.sendMessage(req, res));
app.get('/api/status', verifyToken, (req, res) => whatsappController.getStatus(req, res));
app.get('/api/qr-status', verifyToken, (req, res) => whatsappController.getQRStatus(req, res));
app.post('/api/restart', verifyToken, (req, res) => whatsappController.restartClient(req, res));

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Ruta no encontrada',
        path: req.path
    });
});

// Manejo de errores global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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