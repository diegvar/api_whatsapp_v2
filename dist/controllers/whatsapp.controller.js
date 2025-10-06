"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const whatsapp_service_1 = require("../services/whatsapp.service");
class WhatsAppController {
    constructor() {
        this.whatsappService = new whatsapp_service_1.WhatsAppService();
    }
    async sendMessage(req, res) {
        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            res.status(400).json({
                status: 400,
                message: 'Número y mensaje son requeridos'
            });
            return;
        }
        const response = await this.whatsappService.sendMessage(phoneNumber, message);
        res.status(response.status).json(response);
    }
    getStatus(req, res) {
        const whatsappStatus = this.whatsappService.getStatus();
        res.json({
            status: 200,
            success: true,
            connectionStatus: whatsappStatus.status
        });
    }
    getQRStatus(req, res) {
        const qrStatus = this.whatsappService.getQRStatus();
        res.json({
            status: 200,
            success: true,
            ...qrStatus
        });
    }
    async restartClient(req, res) {
        try {
            await this.whatsappService.restartClient();
            res.json({
                status: 200,
                success: true,
                message: 'Cliente de WhatsApp reiniciado correctamente'
            });
        }
        catch (error) {
            res.status(500).json({
                status: 500,
                success: false,
                message: 'Error al reiniciar el cliente',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
exports.WhatsAppController = WhatsAppController;
