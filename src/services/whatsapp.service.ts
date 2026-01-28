import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { ApiResponse, WhatsAppStatus, QRStatus } from '../types';

export class WhatsAppService {
    private client!: Client;
    private publicDir: string;
    private isReady: boolean = false;
    private isAuthenticated: boolean = false;

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
        // Asegurar que el directorio de autenticación existe
        const authDir = path.join(process.cwd(), '.wwebjs_auth');
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
            console.log('Directorio de autenticación creado:', authDir);
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "whatsapp-client",
                dataPath: authDir
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
            qrMaxRetries: 10,
            authTimeoutMs: 600000
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
        this.client.on('loading_screen', this.handleLoadingScreen.bind(this));
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
        // Verificar inmediatamente que tiene la información básica
        if (this.client && this.client.info && this.client.info.wid) {
            console.log(`Cliente autenticado como: ${this.client.info.wid.user}`);
        }
        
        // Esperar un momento adicional para asegurar que todo esté sincronizado
        // WhatsApp Web necesita tiempo para cargar completamente después de "ready"
        setTimeout(() => {
            // Verificar que realmente está listo antes de marcar como ready
            if (this.client && this.client.info && this.client.info.wid) {
                // Verificar también que no hay QR (doble verificación)
                const qrPath = path.join(this.publicDir, 'qr.png');
                const hasQR = fs.existsSync(qrPath);
                
                if (!hasQR) {
                    this.isReady = true;
                    this.isAuthenticated = true;
                    console.log('✅ Cliente completamente sincronizado y listo para usar');
                } else {
                    console.warn('⚠️ Cliente dijo estar listo pero hay QR disponible - esperando...');
                }
            } else {
                console.warn('⚠️ Cliente dijo estar listo pero no tiene información válida');
            }
        }, 5000); // Esperar 5 segundos después de "ready" para asegurar sincronización completa
        this.removeQRFile();
    }

    private async waitForReady(): Promise<void> {
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

    private handleAuthenticated(): void {
        console.log('Cliente autenticado!');
        this.isAuthenticated = true;
        this.removeQRFile();
    }

    private handleAuthFailure(msg: string): void {
        console.error('Error de autenticación:', msg);
        this.isAuthenticated = false;
        this.isReady = false;
    }

    private handleDisconnected(reason: string): void {
        console.log('Cliente desconectado:', reason);
        this.isReady = false;
        this.isAuthenticated = false;
        
        // Limpiar QR si existe (por si se desconectó y necesita reautenticación)
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            console.log('QR disponible después de desconexión - requiere reautenticación');
        }
        
        // Si se alcanzó el límite de reintentos de QR, intentar reiniciar automáticamente
        if (reason.includes('Max qrcode retries reached')) {
            console.log('⚠️ Se alcanzó el límite de reintentos de QR. Reiniciando cliente en 5 segundos...');
            setTimeout(async () => {
                try {
                    await this.restartClient();
                } catch (error) {
                    console.error('Error al reiniciar automáticamente:', error);
                }
            }, 5000);
        } else {
            // Para otras desconexiones, intentar reconectar después de un tiempo
            console.log('⚠️ Cliente desconectado. Esperando reconexión automática...');
        }
    }

    private handleStateChange(state: string): void {
        console.log('Estado del cliente cambiado a:', state);
        // Actualizar estado según el cambio
        if (state === 'CONNECTED') {
            // CONNECTED no significa READY, solo que está conectado
            console.log('Cliente conectado, esperando sincronización...');
        } else if (state === 'READY') {
            // READY significa que está completamente listo
            console.log('Estado READY confirmado');
            // Esperar un momento antes de marcar como ready
            setTimeout(() => {
                if (this.client && this.client.info && this.client.info.wid) {
                    this.isReady = true;
                    this.isAuthenticated = true;
                }
            }, 2000);
        } else if (state === 'DISCONNECTED' || state === 'UNPAIRED' || state === 'CONFLICT') {
            console.log(`Estado crítico: ${state} - Cliente no disponible`);
            this.isReady = false;
            this.isAuthenticated = false;
        }
    }

    private handleLoadingScreen(percent: string, message: string): void {
        console.log(`Cargando WhatsApp: ${percent}% - ${message}`);
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

        // Verificar formato del número primero
        const formattedNumber = phoneNumber.replace(/[^\d]/g, '');
        const chatId = `${formattedNumber}@c.us`;
        
        if (formattedNumber.length < 10) {
            return {
                status: 400,
                message: 'Número de teléfono inválido. Debe incluir el código de país.',
                error: 'Formato de número incorrecto'
            };
        }

        // Verificar estado inicial
        if (!this.isClientFullyReady()) {
            const qrPath = path.join(this.publicDir, 'qr.png');
            const hasQR = fs.existsSync(qrPath);
            
            if (hasQR) {
                return {
                    status: 503,
                    message: 'Cliente de WhatsApp requiere autenticación. Por favor, escanea el código QR disponible en /qr.png o usa el endpoint /api/qr-status para verificar.',
                    error: 'Cliente no autenticado - QR disponible'
                };
            }
            
            // Esperar hasta que el cliente esté completamente listo (máximo 10 segundos)
            const maxWaitTime = 10000; // 10 segundos (reducido porque si no está listo, probablemente necesita QR)
            const startTime = Date.now();
            
            while (!this.isClientFullyReady() && (Date.now() - startTime) < maxWaitTime) {
                console.log('Esperando a que el cliente esté completamente listo...');
                await this.waitForClient(1000);
            }

            if (!this.isClientFullyReady()) {
                const qrPathCheck = path.join(this.publicDir, 'qr.png');
                const hasQRCheck = fs.existsSync(qrPathCheck);
                
                return {
                    status: 503,
                    message: hasQRCheck 
                        ? 'Cliente de WhatsApp requiere autenticación. Por favor, escanea el código QR primero.'
                        : 'Cliente de WhatsApp no está conectado. Verifica el estado con /api/status.',
                    error: 'Cliente no disponible - requiere autenticación o conexión'
                };
            }
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Verificación adicional antes de cada intento
                if (!this.isClientFullyReady()) {
                    if (attempt === maxRetries) {
                        return {
                            status: 503,
                            message: 'Cliente de WhatsApp perdió la conexión. Intenta reconectar.',
                            error: 'Cliente desconectado durante el envío'
                        };
                    }
                    console.log(`Intento ${attempt}/${maxRetries}: Cliente no listo, esperando...`);
                    await this.waitForClient(3000);
                    continue;
                }

                // Verificar una vez más que el cliente tiene acceso a las funciones internas
                if (!this.client || !this.client.pupPage) {
                    throw new Error('El cliente no tiene acceso a Puppeteer - no está completamente inicializado');
                }

                // Esperar un momento adicional para asegurar que todo esté sincronizado
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
                
                // Manejar errores específicos
                if (lastError.message.includes('getChat') || lastError.message.includes('Cannot read properties of undefined')) {
                    console.error('Error: El cliente no está completamente inicializado');
                    this.isReady = false;
                    
                    if (attempt === maxRetries) {
                        return {
                            status: 503,
                            message: 'Cliente de WhatsApp no está completamente inicializado. Por favor, espera a que termine la autenticación o reinicia el cliente.',
                            error: 'Cliente no inicializado correctamente'
                        };
                    }
                    // Esperar más tiempo antes del siguiente intento
                    await this.waitForClient(5000);
                    continue;
                }
                
                // Si es el último intento, manejar el error
                if (attempt === maxRetries) {
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

    private isClientFullyReady(): boolean {
        try {
            // Verificación más estricta: debe estar listo Y autenticado
            const hasClient = !!(this.client);
            const hasInfo = !!(this.client?.info);
            const hasWid = !!(this.client?.info?.wid);
            const isReady = this.isReady;
            const isAuthenticated = this.isAuthenticated;
            
            // Verificar también que no hay QR pendiente
            const qrPath = path.join(this.publicDir, 'qr.png');
            const hasQR = fs.existsSync(qrPath);
            
            const fullyReady = isReady && 
                              isAuthenticated && 
                              hasClient && 
                              hasInfo && 
                              hasWid &&
                              !hasQR; // No debe haber QR si está autenticado
            
            if (!fullyReady) {
                console.log('Cliente no completamente listo:', {
                    isReady,
                    isAuthenticated,
                    hasClient,
                    hasInfo,
                    hasWid,
                    hasQR
                });
            }
            
            return fullyReady;
        } catch (error) {
            console.error('Error verificando estado completo del cliente:', error);
            return false;
        }
    }

    private async waitForClient(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public getStatus(): WhatsAppStatus {
        const isReady = this.isClientFullyReady();
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
            this.isReady = false;
            this.isAuthenticated = false;
            
            if (this.client) {
                await this.client.destroy();
            }
            
            // Esperar un momento antes de reinicializar
            await this.waitForClient(2000);
            this.initializeClient();
        } catch (error) {
            console.error('Error al reiniciar el cliente:', error);
            this.isReady = false;
            this.isAuthenticated = false;
        }
    }
} 