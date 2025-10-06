"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = __importStar(require("qrcode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WhatsAppService {
    constructor() {
        this.publicDir = path.join(__dirname, '../../public');
        this.ensurePublicDir();
        this.initializeClient();
    }
    ensurePublicDir() {
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
    }
    initializeClient() {
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                clientId: "whatsapp-client"
            }),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                headless: true,
                timeout: 120000
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.54.html',
            },
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000,
            qrMaxRetries: 3,
            authTimeoutMs: 300000
        });
        this.setupEventHandlers();
        this.client.initialize();
    }
    setupEventHandlers() {
        this.client.on('qr', this.handleQR.bind(this));
        this.client.on('ready', this.handleReady.bind(this));
        this.client.on('authenticated', this.handleAuthenticated.bind(this));
        this.client.on('auth_failure', this.handleAuthFailure.bind(this));
        this.client.on('disconnected', this.handleDisconnected.bind(this));
        this.client.on('change_state', this.handleStateChange.bind(this));
        this.client.on('loading_screen', this.handleLoadingScreen.bind(this));
    }
    async handleQR(qr) {
        try {
            console.log('Generando nuevo código QR...');
            const qrImage = await qrcode.toDataURL(qr);
            const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
            const qrPath = path.join(this.publicDir, 'qr.png');
            fs.writeFileSync(qrPath, base64Data, 'base64');
            console.log('Código QR generado y guardado en:', qrPath);
            if (fs.existsSync(qrPath)) {
                console.log('Archivo QR verificado correctamente');
            }
            else {
                console.error('Error: El archivo QR no se creó correctamente');
            }
        }
        catch (error) {
            console.error('Error al generar el código QR:', error);
        }
    }
    handleReady() {
        console.log('Cliente WhatsApp está listo!');
        this.removeQRFile();
    }
    async waitForReady() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('Timeout: Cliente no completó sincronización en 5 minutos');
                resolve();
            }, 300000); // 5 minutos
            this.client.once('ready', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }
    handleAuthenticated() {
        console.log('Cliente autenticado!');
        this.removeQRFile();
    }
    handleAuthFailure(msg) {
        console.error('Error de autenticación:', msg);
    }
    handleDisconnected(reason) {
        console.log('Cliente desconectado:', reason);
    }
    handleStateChange(state) {
        console.log('Estado del cliente cambiado a:', state);
    }
    handleLoadingScreen(percent, message) {
        console.log(`Cargando WhatsApp: ${percent}% - ${message}`);
    }
    removeQRFile() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
            console.log('Archivo QR eliminado después de la autenticación');
        }
    }
    async sendMessage(phoneNumber, message) {
        const maxRetries = 3;
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Verificar si el cliente está conectado y autenticado
                if (!this.isClientReady()) {
                    if (attempt === maxRetries) {
                        return {
                            status: 503,
                            message: 'Cliente de WhatsApp no está conectado. Verifica el estado de la conexión.',
                            error: 'Cliente no disponible'
                        };
                    }
                    console.log(`Intento ${attempt}/${maxRetries}: Cliente no listo, esperando...`);
                    await this.waitForClient(2000);
                    continue;
                }
                const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
                const chatId = `${formattedNumber}@c.us`;
                // Verificar que el número tenga el formato correcto
                if (formattedNumber.length < 10) {
                    return {
                        status: 400,
                        message: 'Número de teléfono inválido. Debe incluir el código de país.',
                        error: 'Formato de número incorrecto'
                    };
                }
                // Esperar un poco más para asegurar que el cliente esté completamente listo
                await this.waitForClient(1000);
                const response = await this.client.sendMessage(chatId, message);
                return {
                    status: 200,
                    message: 'El mensaje se ha enviado con éxito',
                    data: {
                        id: response.id._serialized,
                        timestamp: response.timestamp,
                        from: response.from,
                        to: response.to,
                        body: response.body
                    }
                };
            }
            catch (error) {
                lastError = error;
                console.error(`Error al enviar mensaje (intento ${attempt}/${maxRetries}):`, error);
                // Si es el último intento, manejar el error
                if (attempt === maxRetries) {
                    // Manejar errores específicos
                    if (lastError.message.includes('sendSeen')) {
                        return {
                            status: 503,
                            message: 'Cliente de WhatsApp no está listo. Intenta reconectar.',
                            error: 'Cliente no autenticado correctamente'
                        };
                    }
                    if (lastError.message.includes('not-authorized')) {
                        return {
                            status: 401,
                            message: 'No autorizado. Verifica la conexión de WhatsApp.',
                            error: 'Sesión no autorizada'
                        };
                    }
                    return {
                        status: 500,
                        message: 'Error al enviar mensaje',
                        error: lastError.message
                    };
                }
                // Esperar antes del siguiente intento
                await this.waitForClient(2000);
            }
        }
        return {
            status: 500,
            message: 'Error al enviar mensaje después de múltiples intentos',
            error: lastError?.message || 'Error desconocido'
        };
    }
    isClientReady() {
        try {
            // Verificar múltiples condiciones para asegurar que el cliente esté listo
            return !!(this.client &&
                this.client.info &&
                this.client.info.wid);
        }
        catch (error) {
            console.error('Error verificando estado del cliente:', error);
            return false;
        }
    }
    async waitForClient(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getStatus() {
        const isReady = this.isClientReady();
        return {
            status: isReady ? 'conectado' : 'desconectado'
        };
    }
    getQRStatus() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        return {
            hasQR: fs.existsSync(qrPath)
        };
    }
    async restartClient() {
        try {
            console.log('Reiniciando cliente de WhatsApp...');
            if (this.client) {
                await this.client.destroy();
            }
            this.initializeClient();
        }
        catch (error) {
            console.error('Error al reiniciar el cliente:', error);
        }
    }
}
exports.WhatsAppService = WhatsAppService;
