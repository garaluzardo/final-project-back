const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { listAvailableModels } = require("../config/ai.config");

// Ruta para listar modelos (para debugging)
router.get("/models", isAuthenticated, async (req, res) => {
  try {
    const models = await listAvailableModels();
    res.json(models);
  } catch (error) {
    console.error("Error listando modelos:", error);
    res.status(500).json({ 
      message: "Error obteniendo lista de modelos",
      error: error.message 
    });
  }
});

// Ruta principal de chat
router.post("/chat", isAuthenticated, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    
    // Validar mensaje
    if (!message) {
      return res.status(400).json({ message: "El mensaje es requerido" });
    }
    
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
});

module.exports = router;