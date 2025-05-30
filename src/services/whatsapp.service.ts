import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { ApiResponse, WhatsAppStatus, QRStatus } from '../types';

export class WhatsAppService {
    private client!: Client;
    private publicDir: string;

    constructor() {
        this.publicDir = path.join(__dirname, '../../public');
        this.ensurePublicDir();
        this.initializeClient();
    }

    private ensurePublicDir(): void {
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
    }

    private initializeClient(): void {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox']
            }
        });

        this.setupEventHandlers();
        this.client.initialize();
    }

    private setupEventHandlers(): void {
        this.client.on('qr', this.handleQR.bind(this));
        this.client.on('ready', this.handleReady.bind(this));
        this.client.on('authenticated', this.handleAuthenticated.bind(this));
        this.client.on('auth_failure', this.handleAuthFailure.bind(this));
    }

    private async handleQR(qr: string): Promise<void> {
        try {
            console.log('Generando nuevo código QR...');
            const qrImage = await qrcode.toDataURL(qr);
            const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
            const qrPath = path.join(this.publicDir, 'qr.png');
            
            fs.writeFileSync(qrPath, base64Data, 'base64');
            console.log('Código QR generado y guardado en:', qrPath);
            
            if (fs.existsSync(qrPath)) {
                console.log('Archivo QR verificado correctamente');
            } else {
                console.error('Error: El archivo QR no se creó correctamente');
            }
        } catch (error) {
            console.error('Error al generar el código QR:', error);
        }
    }

    private handleReady(): void {
        console.log('Cliente WhatsApp está listo!');
        this.removeQRFile();
    }

    private handleAuthenticated(): void {
        console.log('Cliente autenticado!');
        this.removeQRFile();
    }

    private handleAuthFailure(msg: string): void {
        console.error('Error de autenticación:', msg);
    }

    private removeQRFile(): void {
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
            console.log('Archivo QR eliminado después de la autenticación');
        }
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<ApiResponse> {
        try {
            const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            const chatId = `${formattedNumber}@c.us`;
            const response = await this.client.sendMessage(chatId, message);
            
            return {
                status: 200,
                message: 'El mensaje se ha enviado con éxito',
                data: response
            };
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            return {
                status: 500,
                message: 'Error al enviar mensaje',
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    public getStatus(): WhatsAppStatus {
        return {
            status: this.client.info ? 'conectado' : 'desconectado'
        };
    }

    public getQRStatus(): QRStatus {
        const qrPath = path.join(this.publicDir, 'qr.png');
        return {
            hasQR: fs.existsSync(qrPath)
        };
    }
} 