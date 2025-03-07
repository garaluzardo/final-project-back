const express = require("express");
const router = express.Router();
const Task = require("../models/Task.model");

// Ruta para obtener todas las tareas
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo las tareas", error: error.message });
  }
});

// Ruta para crear una nueva tarea
router.post("/", async (req, res) => {
  const { title, description } = req.body; // Recibimos los datos del body

  try {
    const newTask = new Task({ title, description }); // Creamos la nueva tarea
    await newTask.save(); // Guardamos la tarea en la base de datos
    res.status(201).json(newTask); // Respondemos con la tarea creada
  } catch (error) {
    res.status(500).json({ message: "Error creando la tarea", error: error.message });
  }
});

// Ruta para obtener una tarea específica por su id
router.get("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL

  try {
    const task = await Task.findById(id); // Buscamos la tarea por su id
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    res.json(task); // Respondemos con la tarea encontrada
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo la tarea", error: error.message });
  }
});

// Ruta para actualizar una tarea
router.put("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL
  const { title, description } = req.body; // Obtenemos los datos a actualizar

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id, 
      { title, description }, 
      { new: true } // Devuelve la tarea actualizada
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    res.json(updatedTask); // Respondemos con la tarea actualizada
  } catch (error) {
    res.status(500).json({ message: "Error actualizando la tarea", error: error.message });
  }
});

// Ruta para eliminar una tarea
router.delete("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL

  try {
    const deletedTask = await Task.findByIdAndDelete(id); // Buscamos y eliminamos la tarea por su id
    if (!deletedTask) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    res.json({ message: "Tarea eliminada" }); // Respondemos confirmando la eliminación
  } catch (error) {
    res.status(500).json({ message: "Error eliminando la tarea", error: error.message });
  }
});

module.exports = router;
