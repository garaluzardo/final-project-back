const Animal = require("../models/Animal.model");
const Shelter = require("../models/Shelter.model");
/* const Task = require("../models/Task.model"); */

/**
 * Verifico si el usuario actual (req.payload._id) es administrador
 * de la protectora especificada (por shelterId o mediante el ID del animal)
 */
const isShelterAdmin = async (req, res, next) => {
  try {
    // Obtener el ID del usuario desde el token JWT
    const userId = req.payload._id;
    if (!userId) {
      return res.status(400).json({ message: "ID de usuario no encontrado en el token" });
    }
    
    let shelterId;
    
    // Caso 1: El ID de la protectora viene en la URL
    if (req.params.shelterId) {
      shelterId = req.params.shelterId;
    } 
    // Caso 2: La solicitud está relacionada con un animal específico
    else if (req.params.id) {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal no encontrado" });
      }
      shelterId = animal.shelter;
    }
    
    if (!shelterId) {
      return res.status(400).json({ message: "No se pudo determinar la protectora" });
    }
    
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(shelterId);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    
    // Verificar si el usuario es administrador de la protectora
    if (!shelter.admins.includes(userId)) {
      return res.status(403).json({ 
        message: "No tienes permisos de administrador en esta protectora" 
      });
    }
    
    // Si llegamos aquí, el usuario es administrador de la protectora
    // Añadimos el ID de la protectora al objeto req para uso posterior
    req.shelterId = shelterId;
    next();
    
  } catch (error) {
    return res.status(500).json({ 
      message: "Error al verificar permisos de administrador", 
      error: error.message 
    });
  }
};

/* const isShelterMember */

module.exports = {
  isShelterAdmin
};