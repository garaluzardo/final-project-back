const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const { isAuthenticated } = require("../middleware/jwt.middleware");

router.post("/chat", isAuthenticated, async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "El mensaje es requerido" });
    }
    
    const response = await aiService.getChatResponse(message, chatHistory);
    
    if (!response.success) {
      return res.status(500).json({ message: response.error });
    }
    
    res.json({ response: response.data });
  } catch (error) {
    console.error("Error en ruta de chat:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;