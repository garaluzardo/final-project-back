const Shelter = require("../models/Shelter.model");
const Animal = require("../models/Animal.model");
const Task = require("../models/Task.model");

/**
 * Middleware base para obtener el contexto de la protectora y verificar permisos
 * Este middleware es la base para los demás middlewares de permisos
 */
const getShelterContext = async (req, res, next) => {
  try {
    // Obtener el ID del usuario desde el token JWT
    const userId = req.payload._id;
    if (!userId) {
      return res.status(400).json({ message: "ID de usuario no encontrado en el token" });
    }
    
    let shelterId;
    
    // Caso 1: El ID de la protectora viene directamente en la URL
    if (req.params.shelterId) {
      shelterId = req.params.shelterId;
    } 
    // Caso 2: El ID de la protectora viene de una tarea previamente cargada
    else if (req.task && req.task.shelter) {
      shelterId = req.task.shelter;
    }
    // Caso 3: La solicitud está relacionada con una tarea por ID
    else if (req.params.id && !req.task && req.baseUrl.includes('/tasks')) {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }
      shelterId = task.shelter;
      req.task = task; // Guardar la tarea para no buscarla de nuevo
    }
    // Caso 4: La solicitud está relacionada con un animal por ID
    else if (req.params.id && !req.animal && req.baseUrl.includes('/animals')) {
      const animal = await Animal.findById(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal no encontrado" });
      }
      shelterId = animal.shelter;
      req.animal = animal; // Guardar el animal para no buscarlo de nuevo
    }
    // Caso 5: El ID de la protectora viene en el body al crear algo
    else if (req.body.shelter) {
      shelterId = req.body.shelter;
    }
    
    if (!shelterId) {
      return res.status(400).json({ message: "No se pudo determinar la protectora" });
    }
    
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(shelterId);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    
    // Determinar los permisos del usuario
    const isAdmin = shelter.admins.includes(userId);
    const isVolunteer = shelter.volunteers.includes(userId);
    
    // Guardar toda la información en req
    req.shelter = {
      id: shelterId,
      data: shelter,
      permissions: {
        isAdmin,
        isVolunteer,
        isMember: isVolunteer // Todos los miembros son voluntarios
      }
    };
    
    // Para mantener compatibilidad con código existente
    req.shelterId = shelterId; 
    req.shelterPermissions = {
      isAdmin,
      isVolunteer,
      isMember: isVolunteer
    };
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error al verificar permisos", 
      error: error.message 
    });
  }
};

/**
 * Middleware para verificar si el usuario es miembro (voluntario) de la protectora
 * Requiere que getShelterContext se ejecute primero
 */
const requireShelterMember = (req, res, next) => {
  if (!req.shelter || !req.shelter.permissions.isVolunteer) {
    return res.status(403).json({ 
      message: "No eres miembro de esta protectora" 
    });
  }
  next();
};

/**
 * Middleware para verificar si el usuario es administrador de la protectora
 * Requiere que getShelterContext se ejecute primero
 */
const requireShelterAdmin = (req, res, next) => {
  if (!req.shelter || !req.shelter.permissions.isAdmin) {
    return res.status(403).json({ 
      message: "No tienes permisos de administrador en esta protectora" 
    });
  }
  next();
};

/**
 * Middleware combinado para verificar si el usuario es miembro de la protectora
 * Este es un middleware compuesto que se puede usar directamente en las rutas
 */
const isShelterMember = [getShelterContext, requireShelterMember];

/**
 * Middleware combinado para verificar si el usuario es administrador de la protectora
 * Este es un middleware compuesto que se puede usar directamente en las rutas
 */
const isShelterAdmin = [getShelterContext, requireShelterAdmin];

/**
 * Middleware para cargar una tarea por ID y verificar su existencia
 * Útil para rutas que manipulan tareas específicas
 */
const loadTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    req.task = task;
    req.shelterId = task.shelter;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error cargando la tarea", 
      error: error.message 
    });
  }
};

/**
 * Middleware para cargar un animal por ID y verificar su existencia
 * Útil para rutas que manipulan animales específicos
 */
const loadAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await Animal.findById(animalId);
    
    if (!animal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    req.animal = animal;
    req.shelterId = animal.shelter;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error cargando el animal", 
      error: error.message 
    });
  }
};

/**
 * Middleware para cargar una protectora por ID y verificar su existencia
 * Útil para rutas que manipulan protectoras específicas
 */
const loadShelter = async (req, res, next) => {
  try {
    const shelterId = req.params.id;
    const shelter = await Shelter.findById(shelterId);
    
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    
    req.shelter = {
      data: shelter,
      id: shelter._id
    };
    req.shelterId = shelter._id;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: "Error cargando la protectora", 
      error: error.message 
    });
  }
};

module.exports = {
  // Middlewares base
  getShelterContext,
  requireShelterMember,
  requireShelterAdmin,
  loadTask,
  loadAnimal,
  loadShelter,
  
  // Middlewares compuestos (para compatibilidad con código existente)
  isShelterMember,
  isShelterAdmin
};