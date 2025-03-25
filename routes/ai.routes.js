const express = require("express");
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const aiService = require("../services/ai.service");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// 1. Configuración de límite de tasa
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Límite de 50 solicitudes por usuario
  message: { 
    message: "Demasiadas solicitudes, por favor intenta de nuevo más tarde." 
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

// 2. Middleware de validación para el chat
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
    .escape(), // Previene inyección de HTML
  body('chatHistory')
    .optional()
    .isArray({ max: 10 }).withMessage('Un máximo de 10 mensajes de historial')
];

// 3. Middleware para manejar errores de validación
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

// 4. Ruta principal de chat
router.post(
  "/chat", 
  isAuthenticated,         // Middleware de autenticación
  chatRateLimiter,         // Límite de tasa
  validateChatMessage,     // Validación de entrada
  handleValidationErrors,  // Manejo de errores de validación
  async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      
      // Obtener respuesta de IA
      const response = await aiService.getChatResponse(message, chatHistory);
      
      // Log detallado para depuración
      console.log("Respuesta de IA:", {
        success: response.success,
        data: response.data,
        error: response.error
      });
      
      // Manejar diferentes escenarios de respuesta
      if (!response.success) {
        return res.status(500).json({ 
          message: response.error,
          fullError: response.fullError
        });
      }
      
      // Respuesta exitosa
      res.json({ 
        response: response.data 
      });
    } catch (error) {
      console.error("Error completo en ruta de chat de IA:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        errorDetails: error.message,
        stack: error.stack
      });
    }
  }
);

module.exports = router;