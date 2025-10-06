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
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ],
                headless: true,
                timeout: 60000
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            },
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 0
        });

        this.setupEventHandlers();
        this.client.initialize();
    }

    private setupEventHandlers(): void {
        this.client.on('qr', this.handleQR.bind(this));
        this.client.on('ready', this.handleReady.bind(this));
        this.client.on('authenticated', this.handleAuthenticated.bind(this));
        this.client.on('auth_failure', this.handleAuthFailure.bind(this));
        this.client.on('disconnected', this.handleDisconnected.bind(this));
        this.client.on('change_state', this.handleStateChange.bind(this));
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

    private handleDisconnected(reason: string): void {
        console.log('Cliente desconectado:', reason);
    }

    private handleStateChange(state: string): void {
        console.log('Estado del cliente cambiado a:', state);
    }

    private removeQRFile(): void {
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
            console.log('Archivo QR eliminado después de la autenticación');
        }
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<ApiResponse> {
        const maxRetries = 3;
        let lastError: Error | null = null;

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
            } catch (error) {
                lastError = error as Error;
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

    private isClientReady(): boolean {
        try {
            // Verificar múltiples condiciones para asegurar que el cliente esté listo
            return !!(this.client && 
                     this.client.info && 
                     this.client.info.wid);
        } catch (error) {
            console.error('Error verificando estado del cliente:', error);
            return false;
        }
    }

    private async waitForClient(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public getStatus(): WhatsAppStatus {
        const isReady = this.isClientReady();
        return {
            status: isReady ? 'conectado' : 'desconectado'
        };
    }

    public getQRStatus(): QRStatus {
        const qrPath = path.join(this.publicDir, 'qr.png');
        return {
            hasQR: fs.existsSync(qrPath)
        };
    }

    public async restartClient(): Promise<void> {
        try {
            console.log('Reiniciando cliente de WhatsApp...');
            if (this.client) {
                await this.client.destroy();
            }
            this.initializeClient();
        } catch (error) {
            console.error('Error al reiniciar el cliente:', error);
        }
    }
} 