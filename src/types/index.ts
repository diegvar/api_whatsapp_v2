export interface SendMessageRequest {
    phoneNumber: string;
    message: string;
}

export interface ApiResponse<T = any> {
    status: number;
    message: string;
    data?: T;
    error?: string;
}

export interface WhatsAppStatus {
    status: 'conectado' | 'desconectado';
}

export interface QRStatus {
    hasQR: boolean;
} 