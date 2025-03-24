// ai.config.js para el backend
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Obtener la API key desde las variables de entorno
const apiKey = process.env.GEMINI_API_KEY;

// Inicializar la API de Google Generative AI
const genAI = new GoogleGenerativeAI(apiKey);

module.exports = {
  genAI
};