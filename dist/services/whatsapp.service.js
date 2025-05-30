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
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox']
            }
        });
        this.setupEventHandlers();
        this.client.initialize();
    }
    setupEventHandlers() {
        this.client.on('qr', this.handleQR.bind(this));
        this.client.on('ready', this.handleReady.bind(this));
        this.client.on('authenticated', this.handleAuthenticated.bind(this));
        this.client.on('auth_failure', this.handleAuthFailure.bind(this));
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
    handleAuthenticated() {
        console.log('Cliente autenticado!');
        this.removeQRFile();
    }
    handleAuthFailure(msg) {
        console.error('Error de autenticación:', msg);
    }
    removeQRFile() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
            console.log('Archivo QR eliminado después de la autenticación');
        }
    }
    async sendMessage(phoneNumber, message) {
        try {
            const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            const chatId = `${formattedNumber}@c.us`;
            const response = await this.client.sendMessage(chatId, message);
            return {
                status: 200,
                message: 'El mensaje se ha enviado con éxito',
                data: response
            };
        }
        catch (error) {
            console.error('Error al enviar mensaje:', error);
            return {
                status: 500,
                message: 'Error al enviar mensaje',
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    getStatus() {
        return {
            status: this.client.info ? 'conectado' : 'desconectado'
        };
    }
    getQRStatus() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        return {
            hasQR: fs.existsSync(qrPath)
        };
    }
}
exports.WhatsAppService = WhatsAppService;
