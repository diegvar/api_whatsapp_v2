import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { SendMessageRequest } from '../types';

export class WhatsAppController {
    private whatsappService: WhatsAppService;

    constructor() {
        this.whatsappService = new WhatsAppService();
    }

    public async sendMessage(req: Request<{}, {}, SendMessageRequest>, res: Response): Promise<void> {
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

    public getStatus(req: Request, res: Response): void {
        const whatsappStatus = this.whatsappService.getStatus();
        res.json({
            status: 200,
            success: true,
            connectionStatus: whatsappStatus.status
        });
    }

    public getQRStatus(req: Request, res: Response): void {
        const qrStatus = this.whatsappService.getQRStatus();
        res.json({
            status: 200,
            success: true,
            ...qrStatus
        });
    }
} 