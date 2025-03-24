// ai.service.js para el backend
const { genAI } = require('../config/ai.config');

class AIService {
  async getChatResponse(prompt) {
    try {
      console.log("Recibido prompt:", prompt);
      
      // Usar el modelo directamente desde genAI
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
      
      // Contexto muy simple
      const systemContext = "Eres un asistente de PETPAL que responde preguntas sobre cuidado animal.";
      
      // Generar respuesta simple
      const result = await model.generateContent(systemContext + " " + prompt);
      const response = result.response.text();
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      // Log detallado del error
      console.error("Error detallado en AIService:", error);
      
      return {
        success: false,
        error: error.message || "Error al procesar la consulta con IA"
      };
    }
  }
}

module.exports = new AIService();