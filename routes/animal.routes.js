const express = require("express");
const router = express.Router();
const Animal = require("../models/Animal.model");

// Obtener todos los animales
router.get("/", async (req, res) => {
  try {
    const animals = await Animal.find();
    res.json(animals);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo los animales", error: error.message });
  }
});

// Obtener un animal por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const animal = await Animal.findById(id);
    if (!animal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    res.json(animal);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo el animal", error: error.message });
  }
});

// Crear un nuevo animal
router.post("/", async (req, res) => {
  const { name, description, age, gender } = req.body;
  try {
    const newAnimal = new Animal({ name, description, age, gender });
    await newAnimal.save();
    res.status(201).json(newAnimal);
  } catch (error) {
    res.status(500).json({ message: "Error creando el animal", error: error.message });
  }
});

// Actualizar un animal por ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, age, gender } = req.body;
  try {
    const updatedAnimal = await Animal.findByIdAndUpdate(
      id,
      { name, description, age, gender },
      { new: true } // Retorna el animal actualizado
    );
    if (!updatedAnimal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    res.status(200).json(updatedAnimal);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando el animal", error: error.message });
  }
});

// Eliminar un animal por ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAnimal = await Animal.findByIdAndDelete(id);
    if (!deletedAnimal) {
      return res.status(404).json({ message: "Animal no encontrado" });
    }
    res.json({ message: "Animal eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando el animal", error: error.message });
  }
});

module.exports = router;
