const express = require("express");
const router = express.Router();
const Animal = require("../models/Animal.model");
const Shelter = require("../models/Shelter.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isShelterAdmin } = require("../middleware/permissions.middleware");

//==============================================================================
// RUTAS PÚBLICAS (No requieren autenticación)
//==============================================================================

// GET /api/animals - Obtener todos los animales (público)
router.get("/", async (req, res) => {
  try {
    // Opciones de filtrado desde query params (para implementar si me da tiempo un filtro de búsqueda general en el front)
    const filters = {};
    
    // Filtros básicos
    if (req.query.species) filters.species = req.query.species;
    if (req.query.gender) filters.gender = req.query.gender;
    if (req.query.size) filters.size = req.query.size;
    if (req.query.status) filters.status = req.query.status;
    
    // Filtros booleanos
    if (req.query.sterilized) filters.sterilized = req.query.sterilized === 'true';
    if (req.query.vaccinated) filters.vaccinated = req.query.vaccinated === 'true';
    if (req.query.microchipped) filters.microchipped = req.query.microchipped === 'true';
    
    // Filtro por protectora
    if (req.query.shelter) filters.shelter = req.query.shelter;
    
    // Ejecutar la consulta ordenando por fecha de creación (más recientes primero)
    const animals = await Animal.find(filters)
      .sort({ createdAt: -1 })
      .populate('shelter', 'name handle location')
      .populate('createdBy', 'name handle');
    
    res.json(animals);
  } catch (error) {
    res.status(500).json({ 
      message: "Error obteniendo los animales", 
      error: error.message 
    });
  }
});

// GET /api/animals/:id - Obtener un animal específico por ID (público)
router.get("/:id", async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('shelter', 'name handle location')
      .populate('createdBy', 'name handle');
    
    if (!animal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    res.json(animal);
  } catch (error) {
    res.status(500).json({ 
      message: "Error obteniendo el animal", 
      error: error.message 
    });
  }
});

// GET /api/animals/shelter/:shelterId - Obtener todos los animales de una protectora (público)
router.get("/shelter/:shelterId", async (req, res) => {
  try {
    const { shelterId } = req.params;
    
    // Verificar que la protectora existe
    const shelter = await Shelter.findById(shelterId);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    
    // Opciones de filtrado
    const filters = { shelter: shelterId };
    
    // Aplicar filtros adicionales desde query params
    if (req.query.species) filters.species = req.query.species;
    if (req.query.gender) filters.gender = req.query.gender;
    if (req.query.size) filters.size = req.query.size;
    if (req.query.status) filters.status = req.query.status;
    
    // Ejecutar la consulta
    const animals = await Animal.find(filters)
      .sort({ createdAt: -1 });
    
    res.json(animals);
  } catch (error) {
    res.status(500).json({ 
      message: "Error obteniendo los animales de la protectora", 
      error: error.message 
    });
  }
});

//==============================================================================
// RUTAS PROTEGIDAS (Requieren autenticación y permisos específicos)
//==============================================================================

// POST /api/animals/shelter/:shelterId - Crear un nuevo animal en una protectora
// Solo administradores de la protectora pueden crear animales
router.post("/shelter/:shelterId", isAuthenticated, isShelterAdmin, async (req, res) => {
  try {
    // El middleware isShelterAdmin ya verificó permisos y añadió req.shelterId
    const shelterId = req.params.shelterId;
    const userId = req.payload._id;
    
    // Crear el nuevo animal
    const newAnimal = new Animal({
      ...req.body,
      shelter: shelterId,
      createdBy: userId
    });
    
    await newAnimal.save();
    
    // Actualizar la referencia en la protectora
    await Shelter.findByIdAndUpdate(shelterId, {
      $push: { animals: newAnimal._id }
    });
    
    res.status(201).json(newAnimal);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creando el animal", 
      error: error.message 
    });
  }
});

// PUT /api/animals/:id - Actualizar todos los campos de un animal
// Solo administradores de la protectora pueden editar
router.put("/:id", isAuthenticated, isShelterAdmin, async (req, res) => {
  try {
    // Evitar modificar el shelter y createdBy
    const { shelter, createdBy, ...updateData } = req.body;
    
    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedAnimal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    res.json(updatedAnimal);
  } catch (error) {
    res.status(500).json({ 
      message: "Error actualizando el animal", 
      error: error.message 
    });
  }
});

// PATCH /api/animals/:id - Actualizar campos específicos de un animal
// Solo administradores de la protectora pueden editar
router.patch("/:id", isAuthenticated, isShelterAdmin, async (req, res) => {
  try {
    // Evitar modificar el shelter y createdBy
    const { shelter, createdBy, ...updateData } = req.body;
    
    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedAnimal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    res.json(updatedAnimal);
  } catch (error) {
    res.status(500).json({ 
      message: "Error actualizando el animal", 
      error: error.message 
    });
  }
});

// PATCH /api/animals/:id/status - Actualizar solo el estado de un animal
// Solo administradores de la protectora pueden cambiar el estado
router.patch("/:id/status", isAuthenticated, isShelterAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validar que el estado sea uno de los permitidos
    const validStatuses = ["Disponible", "En proceso de adopción", "Adoptado", "Acogida temporal"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Estado no válido", 
        validStatuses 
      });
    }
    
    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    
    if (!updatedAnimal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    res.json(updatedAnimal);
  } catch (error) {
    res.status(500).json({ 
      message: "Error actualizando el estado del animal", 
      error: error.message 
    });
  }
});

// DELETE /api/animals/:id - Eliminar un animal
// Solo administradores de la protectora pueden eliminar
router.delete("/:id", isAuthenticated, isShelterAdmin, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    
    // Eliminar la referencia del animal en la protectora
    await Shelter.findByIdAndUpdate(animal.shelter, {
      $pull: { animals: animal._id }
    });
    
    // Eliminar el animal
    await Animal.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Animal eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ 
      message: "Error eliminando el animal", 
      error: error.message 
    });
  }
});

module.exports = router;