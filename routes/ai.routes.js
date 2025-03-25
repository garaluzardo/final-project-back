const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { 
  chatRateLimiter, 
  validateChatMessage, 
  handleValidationErrors 
} = require("../middleware/ai.middleware");

// Ruta principal de chat
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