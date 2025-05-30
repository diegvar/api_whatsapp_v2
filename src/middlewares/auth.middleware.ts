import { Request, Response, NextFunction } from 'express';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;
    const authorzationHeader = process.env.TOKEN_VAL;

    if (!auth) {
        res.status(402).json({ 
            status: 402, 
            message: 'No se ha enviado token' 
        });
        return;
    }

    if (auth !== authorzationHeader) {
        res.status(403).json({ 
            status: 403, 
            message: 'El token enviado no tiene autorización' 
        });
        return;
    }

    next();
}; 