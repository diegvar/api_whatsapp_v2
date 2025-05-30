import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from 'dotenv';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { verifyToken } from './middlewares/auth.middleware';

// Cargar variables de entorno
config();

const app = express();
const port = process.env.PORT || 3000;
const whatsappController = new WhatsAppController();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.post('/api/send-message', verifyToken, (req, res) => whatsappController.sendMessage(req, res));
app.get('/api/status', verifyToken, (req, res) => whatsappController.getStatus(req, res));
app.get('/api/qr-status', verifyToken, (req, res) => whatsappController.getQRStatus(req, res));

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 