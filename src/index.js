const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Inicializar el cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Evento cuando el cliente está listo
client.on('qr', async (qr) => {
    try {
        // Generar el QR como imagen
        const qrImage = await qrcode.toDataURL(qr);
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
        
        // Asegurarse de que el directorio existe
        if (!fs.existsSync('public')) {
            fs.mkdirSync('public');
        }
        
        // Guardar la imagen
        fs.writeFileSync('public/qr.png', base64Data, 'base64');
        console.log('Nuevo código QR generado y guardado en public/qr.png');
    } catch (error) {
        console.error('Error al generar el código QR:', error);
    }
});

client.on('ready', () => {
    console.log('Cliente WhatsApp está listo!');
    // Eliminar el archivo QR cuando el cliente está listo
    if (fs.existsSync('public/qr.png')) {
        fs.unlinkSync('public/qr.png');
    }
});

client.on('authenticated', () => {
    console.log('Cliente autenticado!');
    // Eliminar el archivo QR cuando el cliente está autenticado
    if (fs.existsSync('public/qr.png')) {
        fs.unlinkSync('public/qr.png');
    }
});

client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

// Inicializar el cliente
client.initialize();

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    const authorzationHeader = process.env.TOKEN_VAL;

    if (!auth) {
        return res.status(402).json({ 
            status: 402, 
            message: 'No se ha enviado token' 
        });
    }

    if (auth !== authorzationHeader) {
        return res.status(403).json({ 
            status: 403, 
            message: 'El token enviado no tiene autorización' 
        });
    }

    next();
};

// Ruta para enviar mensaje
app.post('/api/send-message', verifyToken, async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                status: 400,
                message: 'Número y mensaje son requeridos' 
            });
        }

        // Formatear el número (eliminar caracteres especiales y agregar código de país si es necesario)
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
        const chatId = `${formattedNumber}@c.us`;

        // Enviar mensaje
        const response = await client.sendMessage(chatId, message);
        
        res.json({
            status: 200,
            message: 'El mensaje se ha enviado con éxito',
            data: response
        });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({
            status: 500,
            message: 'Error al enviar mensaje',
            error: error.message
        });
    }
});

// Ruta para verificar el estado del cliente
app.get('/api/status', verifyToken, (req, res) => {
    const status = client.info ? 'conectado' : 'desconectado';
    res.json({
        status: 200,
        success: true,
        status: status
    });
});

// Ruta para verificar si hay un código QR disponible
app.get('/api/qr-status', verifyToken, (req, res) => {
    const qrExists = fs.existsSync('public/qr.png');
    res.json({
        status: 200,
        success: true,
        hasQR: qrExists
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 