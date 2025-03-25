const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Configuración de límite de tasa
const chatRateLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutos
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 50, // Límite de 50 solicitudes por usuario
  message: { 
    message: "Demasiadas solicitudes, por favor intenta de nuevo más tarde." 
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Middleware de validación para el chat
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
    .escape(), // Previene inyección de HTML
  body('chatHistory')
    .optional()
    .isArray({ max: 10 }).withMessage('Un máximo de 10 mensajes de historial')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  chatRateLimiter,
  validateChatMessage,
  handleValidationErrors
};