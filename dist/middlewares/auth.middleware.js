"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    const authorizationHeader = process.env.TOKEN_VAL;
    if (!auth) {
        res.status(402).json({
            status: 402,
            message: 'No se ha enviado token'
        });
        return;
    }
    if (!authorizationHeader) {
        res.status(500).json({
            status: 500,
            message: 'Error de configuración del servidor: TOKEN_VAL no está definido'
        });
        return;
    }
    if (auth !== authorizationHeader) {
        res.status(403).json({
            status: 403,
            message: 'El token enviado no tiene autorización'
        });
        return;
    }
    next();
};
exports.verifyToken = verifyToken;
