const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Inicia el cliente de Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sistema de prompt que explica el contexto de la aplicación
const SYSTEM_PROMPT = `
Eres el asistente virtual de PETPAL, una plataforma para conectar protectoras de animales con voluntarios.

Sobre PETPAL:
- Es una aplicación que sirve de punto de encuentro para voluntarios y protectoras de animales donde los usuarios pueden unirse como voluntarios a distintas protectoras, o crear y gestionar protectoras propias.

Tu trabajo:
- Ayudar a responder preguntas sobre cómo usar la aplicación.
- Proporcionar información sobre las funcionalidades de PETPAL.
- Asistir a voluntarios y administradores de protectoras.
- Responder a preguntas sobre animales, tareas, y gestión de protectoras.
- Ser amable, útil y preciso en tus respuestas.
- Solo responder preguntas relacionadas con PETPAL y el trabajo con protectoras de animales.
`;

class AIService {
  async getChatResponse(message, chatHistory = []) {
    try {
      console.log("Received message:", message);
      console.log("History format:", JSON.stringify(chatHistory));
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Modelo que utilizo 
      
      let promptMessage = `${SYSTEM_PROMPT}\n\n`;
      
      // Añadir historial de conversación si existe
      if (chatHistory && chatHistory.length > 0) {
        try {
          // Intentar formatear el historial de manera segura
          for (const msg of chatHistory) {
            if (msg && msg.parts && msg.parts.length > 0 && msg.parts[0].text) {
              const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
              promptMessage += `${role}: ${msg.parts[0].text}\n`;
            }
          }
        } catch (historyError) {
          console.error("Error formateando historial:", historyError);
          // Si hay error en el formato, ignoramos el historial para evitar fallos
        }
      }
      
      // Añade el texto/pregunta del usuario
      promptMessage += `\nUsuario: ${message}\n\nAsistente:`;
      
      // Realiza la petición a Gemini
      console.log("Sending prompt to Gemini...");
      const result = await model.generateContent(promptMessage);
      const response = result.response;
      
      console.log("Received response from Gemini");
      
      // Devuelve el texto con la respuesta
      return {
        success: true,
        data: response.text()
      };
    } catch (error) {
      console.error("Error detallado en AI service:", error);
      
      return {
        success: false,
        error: `Error generating AI response: ${error.message}`
      };
    }
  }
}

module.exports = new AIService();