import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { SendMessageRequest } from '../types';

export class WhatsAppController {
    private whatsappService: WhatsAppService;

    constructor() {
        this.whatsappService = new WhatsAppService();
    }

    public async sendMessage(req: Request<{}, {}, SendMessageRequest>, res: Response): Promise<void> {
        try {
            const { phoneNumber, message } = req.body;

            if (!phoneNumber || !message) {
                res.status(400).json({ 
                    status: 400,
                    message: 'Número y mensaje son requeridos' 
                });
                return;
            }

            // Validar que el mensaje no esté vacío después de trim
            if (message.trim().length === 0) {
                res.status(400).json({ 
                    status: 400,
                    message: 'El mensaje no puede estar vacío' 
                });
                return;
            }

            const response = await this.whatsappService.sendMessage(phoneNumber, message);
            res.status(response.status).json(response);
        } catch (error) {
            console.error('Error en sendMessage controller:', error);
            res.status(500).json({
                status: 500,
                message: 'Error al procesar la solicitud',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    public getStatus(req: Request, res: Response): void {
        try {
            const whatsappStatus = this.whatsappService.getStatus();
            res.json({
                status: 200,
                success: true,
                connectionStatus: whatsappStatus.status
            });
        } catch (error) {
            console.error('Error en getStatus controller:', error);
            res.status(500).json({
                status: 500,
                success: false,
                message: 'Error al obtener el estado',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    public getQRStatus(req: Request, res: Response): void {
        try {
            const qrStatus = this.whatsappService.getQRStatus();
            res.json({
                status: 200,
                success: true,
                ...qrStatus
            });
        } catch (error) {
            console.error('Error en getQRStatus controller:', error);
            res.status(500).json({
                status: 500,
                success: false,
                message: 'Error al obtener el estado del QR',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    public async restartClient(req: Request, res: Response): Promise<void> {
        try {
            await this.whatsappService.restartClient();
            res.json({
                status: 200,
                success: true,
                message: 'Cliente de WhatsApp reiniciado correctamente'
            });
        } catch (error) {
            res.status(500).json({
                status: 500,
                success: false,
                message: 'Error al reiniciar el cliente',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
} 