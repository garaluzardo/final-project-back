const express = require("express");
const router = express.Router();
const Shelter = require("../models/Shelter.model");

// Ruta para obtener todas las protectoras
router.get("/", async (req, res) => {
  try {
    const shelters = await Shelter.find();
    res.json(shelters);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo las protectoras", error: error.message });
  }
});

// Ruta para obtener una protectora específica por su id
router.get("/:id", async (req, res) => {
    const { id } = req.params; // Obtenemos el id desde la URL
  
    try {
      const shelter = await Shelter.findById(id); // Buscamos la protectora por su id
      if (!shelter) {
        return res.status(404).json({ message: "Protectora no encontrada" });
      }
      res.json(shelter); // Respondemos con la protectora encontrada
    } catch (error) {
      res
      .status(500)
      .json({ message: "Error obteniendo la protectora", error: error.message });
    }
  });

// Ruta para crear una nueva protectora
router.post("/", async (req, res) => {
  const { name, description } = req.body; // Recibimos los datos del body

  try {
    const newShelter = new Shelter({ name, description }); // Creamos la nueva protectora
    await newShelter.save(); // Guardamos la protectora en la base de datos
    res.status(201).json(newShelter); // Respondemos con la protectora creada
  } catch (error) {
    res
    .status(500)
    .json({ message: "Error creando la protectora", error: error.message });
  }
});

// Ruta para actualizar una protectora
router.put("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL
  const { name, description } = req.body; // Obtenemos los datos a actualizar

  try {
    const updatedShelter = await Shelter.findByIdAndUpdate(
      id, 
      { name, description }, 
      { new: true } // Devuelve la protectora actualizada
    );
    if (!updatedShelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    res.status(200).json(updatedShelter); // Respondemos con la protectora actualizada
  } catch (error) {
    res
    .status(500)
    .json({ message: "Error actualizando la protectora", error: error.message });
  }
});

// Ruta para eliminar una protectora
router.delete("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL

  try {
    const deletedShelter = await Shelter.findByIdAndDelete(id); // Buscamos y eliminamos la protectora por su id
    if (!deletedShelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }
    res.json({ message: "Protectora eliminada" }); // Respondemos confirmando la eliminación
  } catch (error) {
    res
    .status(500)
    .json({ message: "Error eliminando la protectora", error: error.message });
  }
});

module.exports = router;
