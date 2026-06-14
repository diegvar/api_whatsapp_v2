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
        this.isReady = false;
        this.isAuthenticated = false;
        this.readyHandled = false; // Prevenir múltiples manejos del evento ready
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
        // Asegurar que el directorio de autenticación existe
        const authDir = path.join(process.cwd(), '.wwebjs_auth');
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
            console.log('Directorio de autenticación creado:', authDir);
        }
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                clientId: "whatsapp-client",
                dataPath: authDir
            }),
            webVersion: '2.3000.1041431076-alpha',
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html',
            },
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
            takeoverOnConflict: false,
            takeoverTimeoutMs: 60000,
            qrMaxRetries: 10,
            authTimeoutMs: 600000
        });
        this.setupEventHandlers();
        this.client.initialize();
    }
    setupEventHandlers() {
        // Remover listeners anteriores si existen para evitar duplicados
        this.client.removeAllListeners('qr');
        this.client.removeAllListeners('ready');
        this.client.removeAllListeners('authenticated');
        this.client.removeAllListeners('auth_failure');
        this.client.removeAllListeners('disconnected');
        this.client.removeAllListeners('change_state');
        this.client.removeAllListeners('loading_screen');
        // Agregar listeners con logging adicional
        this.client.on('qr', (qr) => {
            console.log('🔔 Evento QR disparado');
            this.handleQR(qr);
        });
        // Usar on para ready - puede ejecutarse múltiples veces (reautenticación)
        // Pero solo procesar si no está ya manejado o si se reseteó
        this.client.on('ready', () => {
            console.log('🔔 Evento ready capturado');
            this.handleReady();
        });
        this.client.on('authenticated', () => {
            console.log('🔔 Evento authenticated disparado');
            this.handleAuthenticated();
        });
        this.client.on('auth_failure', (msg) => {
            console.log('🔔 Evento auth_failure disparado:', msg);
            this.handleAuthFailure(msg);
        });
        this.client.on('disconnected', (reason) => {
            console.log('🔔 Evento disconnected disparado con razón:', reason);
            console.log('📊 Estado antes de disconnected:', {
                isReady: this.isReady,
                isAuthenticated: this.isAuthenticated,
                readyHandled: this.readyHandled
            });
            this.handleDisconnected(reason);
        });
        this.client.on('change_state', (state) => {
            console.log('🔔 Evento change_state disparado:', state);
            console.log('📊 Estado antes de change_state:', {
                isReady: this.isReady,
                isAuthenticated: this.isAuthenticated,
                readyHandled: this.readyHandled
            });
            this.handleStateChange(state);
        });
        this.client.on('loading_screen', (percent, message) => {
            this.handleLoadingScreen(percent, message);
        });
    }
    async handleQR(qr) {
        try {
            const currentState = {
                isReady: this.isReady,
                isAuthenticated: this.isAuthenticated,
                readyHandled: this.readyHandled,
                hasClient: !!this.client,
                hasInfo: !!(this.client?.info),
                hasWid: !!(this.client?.info?.wid)
            };
            console.log('📱 Generando nuevo código QR...');
            console.log('📊 Estado actual cuando se genera QR:', currentState);
            // Si el cliente ya estaba listo, esto es una reautenticación forzada
            if (currentState.isReady && currentState.isAuthenticated) {
                console.warn('⚠️ ADVERTENCIA: QR generado cuando el cliente ya estaba listo!');
                console.warn('   Esto indica que WhatsApp está pidiendo reautenticación');
                console.warn('   Posibles causas:');
                console.warn('   - WhatsApp detectó actividad sospechosa');
                console.warn('   - Sesión expirada o invalidada');
                console.warn('   - Cambio en la sesión desde otro dispositivo');
                console.warn('');
                console.warn('🔄 El sistema esperará automáticamente a que escanees el QR');
                console.warn('   Una vez escaneado, el cliente volverá a estar listo automáticamente');
                // Marcar como no listo ya que requiere reautenticación
                this.isReady = false;
                this.isAuthenticated = false;
                this.readyHandled = false;
                // Iniciar monitoreo automático para detectar cuando se escanea el QR
                this.monitorQRScan();
            }
            const qrImage = await qrcode.toDataURL(qr);
            const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
            const qrPath = path.join(this.publicDir, 'qr.png');
            fs.writeFileSync(qrPath, base64Data, 'base64');
            console.log('✅ Código QR generado y guardado en:', qrPath);
            if (fs.existsSync(qrPath)) {
                console.log('✅ Archivo QR verificado correctamente');
            }
            else {
                console.error('❌ Error: El archivo QR no se creó correctamente');
            }
        }
        catch (error) {
            console.error('❌ Error al generar el código QR:', error);
        }
    }
    handleReady() {
        // Si ya está listo y manejado, verificar si es una reautenticación
        if (this.readyHandled && this.isReady) {
            console.log('🔄 Evento ready recibido cuando ya estaba listo - posible reautenticación');
            // Resetear para permitir nuevo manejo
            this.readyHandled = false;
        }
        // Prevenir múltiples manejos del mismo ciclo de ready
        if (this.readyHandled && !this.isReady) {
            console.log('⚠️ handleReady llamado pero ya está en proceso - ignorando');
            return;
        }
        console.log('✅ Cliente WhatsApp está listo!');
        this.readyHandled = true;
        // Verificar inmediatamente que tiene la información básica
        if (this.client && this.client.info && this.client.info.wid) {
            console.log(`👤 Cliente autenticado como: ${this.client.info.wid.user}`);
        }
        else {
            console.warn('⚠️ Cliente dijo estar listo pero no tiene información válida aún');
            this.readyHandled = false; // Permitir reintento si no tiene info
            return;
        }
        // Eliminar QR inmediatamente
        this.removeQRFile();
        // Esperar un momento adicional para asegurar que todo esté sincronizado
        // WhatsApp Web necesita tiempo para cargar completamente después de "ready"
        setTimeout(() => {
            // Verificar que realmente está listo antes de marcar como ready
            if (!this.client || !this.client.info || !this.client.info.wid) {
                console.warn('⚠️ Cliente perdió información después de ready - reiniciando verificación');
                this.readyHandled = false;
                return;
            }
            // Verificar también que no hay QR (doble verificación)
            const qrPath = path.join(this.publicDir, 'qr.png');
            const hasQR = fs.existsSync(qrPath);
            if (!hasQR) {
                this.isReady = true;
                this.isAuthenticated = true;
                console.log('✅ Cliente completamente sincronizado y listo para usar');
                console.log('🔄 Reautenticación completada automáticamente');
            }
            else {
                console.warn('⚠️ Cliente dijo estar listo pero hay QR disponible - esperando...');
                this.readyHandled = false; // Permitir reintento si hay QR
            }
        }, 5000); // Esperar 5 segundos después de "ready" para asegurar sincronización completa
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
        // Prevenir logging excesivo del evento authenticated
        if (!this.isAuthenticated) {
            console.log('🔐 Cliente autenticado!');
            this.isAuthenticated = true;
            this.removeQRFile();
        }
        // Si ya está autenticado, no hacer nada (evitar logs repetitivos)
    }
    handleAuthFailure(msg) {
        console.error('Error de autenticación:', msg);
        this.isAuthenticated = false;
        this.isReady = false;
    }
    handleDisconnected(reason) {
        console.log('⚠️ Cliente desconectado. Razón:', reason);
        console.log('📊 Estado antes de desconexión:', {
            isReady: this.isReady,
            isAuthenticated: this.isAuthenticated,
            hasClient: !!this.client,
            hasInfo: !!(this.client?.info),
            hasWid: !!(this.client?.info?.wid)
        });
        this.isReady = false;
        this.isAuthenticated = false;
        this.readyHandled = false; // Resetear para permitir nuevo manejo de ready
        // Limpiar QR si existe (por si se desconectó y necesita reautenticación)
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            console.log('📱 QR disponible después de desconexión - requiere reautenticación');
        }
        // Analizar la razón de desconexión
        if (reason.includes('NAVIGATION')) {
            console.log('🔍 Razón: NAVIGATION - Posible cambio de página o redirección');
        }
        else if (reason.includes('CONFLICT')) {
            console.log('🔍 Razón: CONFLICT - Otra sesión de WhatsApp Web está activa');
        }
        else if (reason.includes('LOGOUT')) {
            console.log('🔍 Razón: LOGOUT - Sesión cerrada desde el teléfono');
        }
        else if (reason.includes('TIMEOUT')) {
            console.log('🔍 Razón: TIMEOUT - Tiempo de espera agotado');
        }
        else if (reason.includes('close')) {
            console.log('🔍 Razón: close - Conexión cerrada');
        }
        // NO reiniciar automáticamente para evitar loops de reconexión
        // El cliente de whatsapp-web.js manejará la reconexión automáticamente
        // Solo registrar el evento
        // Si se alcanzó el límite de reintentos de QR, intentar reiniciar automáticamente
        if (reason.includes('Max qrcode retries reached')) {
            console.log('⚠️ Se alcanzó el límite de reintentos de QR. Reiniciando cliente en 10 segundos...');
            setTimeout(async () => {
                try {
                    await this.restartClient();
                }
                catch (error) {
                    console.error('Error al reiniciar automáticamente:', error);
                }
            }, 10000); // Aumentado a 10 segundos para evitar loops
        }
        else {
            // Para otras desconexiones, el cliente intentará reconectar automáticamente
            console.log('🔄 Cliente desconectado. El cliente intentará reconectar automáticamente...');
            console.log('   Si el problema persiste, verifica:');
            console.log('   1. Que no haya otra sesión de WhatsApp Web abierta');
            console.log('   2. Que la sesión no haya sido cerrada desde el teléfono');
            console.log('   3. Que la conexión a internet sea estable');
        }
    }
    handleStateChange(state) {
        console.log('📊 Estado del cliente cambiado a:', state);
        // Actualizar estado según el cambio
        if (state === 'CONNECTED') {
            // CONNECTED no significa READY, solo que está conectado
            console.log('🔗 Cliente conectado, esperando sincronización...');
        }
        else if (state === 'READY') {
            // READY significa que está completamente listo
            console.log('✅ Estado READY confirmado en change_state');
            // No marcar como ready aquí, dejar que handleReady lo haga
            // Solo si handleReady no se ha ejecutado aún
            if (!this.readyHandled) {
                setTimeout(() => {
                    if (this.client && this.client.info && this.client.info.wid) {
                        const qrPath = path.join(this.publicDir, 'qr.png');
                        if (!fs.existsSync(qrPath)) {
                            this.isReady = true;
                            this.isAuthenticated = true;
                            this.readyHandled = true;
                            console.log('✅ Cliente marcado como listo desde change_state');
                        }
                    }
                }, 2000);
            }
        }
        else if (state === 'DISCONNECTED' || state === 'UNPAIRED' || state === 'CONFLICT') {
            console.log(`❌ Estado crítico: ${state} - Cliente no disponible`);
            if (state === 'CONFLICT') {
                console.log('⚠️ CONFLICT: Otra sesión de WhatsApp Web está activa. Cierra otras sesiones.');
            }
            else if (state === 'UNPAIRED') {
                console.log('⚠️ UNPAIRED: La sesión fue cerrada desde el teléfono. Necesitas escanear QR nuevamente.');
            }
            this.isReady = false;
            this.isAuthenticated = false;
            this.readyHandled = false;
        }
        else if (state === 'OPENING') {
            console.log('🔄 Estado: OPENING - Abriendo conexión...');
        }
        else if (state === 'PAIRING') {
            console.log('🔐 Estado: PAIRING - Emparejando dispositivo...');
        }
    }
    handleLoadingScreen(percent, message) {
        console.log(`Cargando WhatsApp: ${percent}% - ${message}`);
    }
    removeQRFile() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
            console.log('🗑️ Archivo QR eliminado después de la autenticación');
        }
    }
    monitorQRScan() {
        const qrPath = path.join(this.publicDir, 'qr.png');
        const maxWaitTime = 300000; // 5 minutos máximo
        const checkInterval = 2000; // Verificar cada 2 segundos
        const startTime = Date.now();
        console.log('👀 Monitoreando QR para detectar cuando se escanee...');
        const checkQR = setInterval(() => {
            const elapsed = Date.now() - startTime;
            // Si el QR ya no existe, significa que se escaneó
            if (!fs.existsSync(qrPath)) {
                console.log('✅ QR escaneado detectado! Esperando que el cliente vuelva a estar listo...');
                clearInterval(checkQR);
                // El evento ready se disparará automáticamente cuando esté listo
                return;
            }
            // Si el cliente ya está listo, cancelar monitoreo
            if (this.isReady && this.isAuthenticated) {
                console.log('✅ Cliente ya está listo - cancelando monitoreo de QR');
                clearInterval(checkQR);
                return;
            }
            // Si se agotó el tiempo, cancelar
            if (elapsed >= maxWaitTime) {
                console.warn('⏱️ Tiempo de espera agotado para escanear QR');
                clearInterval(checkQR);
                return;
            }
            // Mostrar progreso cada 30 segundos
            if (elapsed % 30000 < checkInterval) {
                const remaining = Math.floor((maxWaitTime - elapsed) / 1000);
                console.log(`⏳ Esperando escaneo de QR... (${remaining}s restantes)`);
            }
        }, checkInterval);
    }
    async sendMessage(phoneNumber, message) {
        const maxRetries = 3;
        let lastError = null;
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
                if (!this.client) {
                    throw new Error('El cliente no existe');
                }
                if (!this.client.pupPage) {
                    throw new Error('El cliente no tiene acceso a Puppeteer - no está completamente inicializado');
                }
                // Verificar que el cliente tiene acceso a la información básica
                if (!this.client.info || !this.client.info.wid) {
                    throw new Error('El cliente no tiene información válida - no está completamente sincronizado');
                }
                // Verificación adicional: intentar acceder a una propiedad interna para verificar que está listo
                try {
                    // Verificar que el cliente tiene el objeto interno necesario
                    if (!this.client.pupPage || !this.client.pupPage.evaluate) {
                        throw new Error('El cliente no tiene acceso completo a Puppeteer');
                    }
                }
                catch (verifyError) {
                    console.error('Error verificando acceso a Puppeteer:', verifyError);
                    throw new Error('El cliente no está completamente inicializado - falta acceso a funciones internas');
                }
                // Esperar un momento adicional para asegurar que todo esté sincronizado
                await this.waitForClient(2000);
                // Intentar enviar el mensaje
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
                // Manejar errores específicos relacionados con inicialización
                if (lastError.message.includes('getChat') ||
                    lastError.message.includes('Cannot read properties of undefined') ||
                    lastError.message.includes('no está completamente inicializado') ||
                    lastError.message.includes('no tiene acceso')) {
                    console.error('Error: El cliente no está completamente inicializado');
                    // NO cambiar isReady a false aquí para evitar desconexión innecesaria
                    // Solo marcar como no listo temporalmente
                    if (attempt === maxRetries) {
                        // No desconectar, solo reportar el error
                        return {
                            status: 503,
                            message: 'Cliente de WhatsApp no está completamente sincronizado. Por favor, espera unos segundos y vuelve a intentar, o verifica el estado con /api/status.',
                            error: 'Cliente no completamente sincronizado - intenta de nuevo en unos segundos'
                        };
                    }
                    // Esperar más tiempo antes del siguiente intento para dar tiempo a sincronizar
                    console.log(`Esperando ${5000 * attempt}ms antes del siguiente intento para permitir sincronización...`);
                    await this.waitForClient(5000 * attempt); // Espera progresiva
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
    isClientFullyReady() {
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
        }
        catch (error) {
            console.error('Error verificando estado completo del cliente:', error);
            return false;
        }
    }
    async waitForClient(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getStatus() {
        const isReady = this.isClientFullyReady();
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
            console.log('🔄 Reiniciando cliente de WhatsApp...');
            this.isReady = false;
            this.isAuthenticated = false;
            this.readyHandled = false; // Resetear flag de ready
            if (this.client) {
                await this.client.destroy();
            }
            // Esperar un momento antes de reinicializar
            await this.waitForClient(2000);
            this.initializeClient();
        }
        catch (error) {
            console.error('Error al reiniciar el cliente:', error);
            this.isReady = false;
            this.isAuthenticated = false;
            this.readyHandled = false;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
