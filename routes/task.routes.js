const express = require("express");
const router = express.Router();
const Task = require("../models/Task.model");
const Shelter = require("../models/Shelter.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");
const { 
  getShelterContext, 
  requireShelterAdmin,
  requireShelterMember,
  loadTask,
  isShelterMember, 
  isShelterAdmin 
} = require("../middleware/permissions.middleware");

// Función auxiliar para poblar campos en una tarea
const populateTask = async (taskId) => {
  return Task.findById(taskId)
    .populate('createdBy', 'name handle profilePicture')
    .populate('completedBy', 'name handle profilePicture')
    .populate('shelter', 'name handle')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'name handle profilePicture'
      }
    });
};

//==============================================================================
// RUTAS PÚBLICAS (permitidas para todos)
//==============================================================================

// Obtener todas las tareas de una protectora específica
router.get("/shelter/:shelterId", async (req, res) => {
  try {
    const { shelterId } = req.params;
    const tasks = await Task.find({ shelter: shelterId })
      .populate('createdBy', 'name handle profilePicture')
      .populate('completedBy', 'name handle profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name handle profilePicture'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo tareas", error: error.message });
  }
});

// Obtener una tarea específica por ID
router.get("/:id", async (req, res) => {
  try {
    const task = await populateTask(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo la tarea", error: error.message });
  }
});

//==============================================================================
// RUTAS PARA VOLUNTARIOS Y ADMINS (requieren ser miembro de la protectora)
//==============================================================================

// Marcar/desmarcar tarea como completada
router.patch("/:id/toggle-complete", isAuthenticated, loadTask, getShelterContext, requireShelterMember, async (req, res) => {
  try {
    const task = req.task;
    
    // Invertir el estado de completado
    task.completed = !task.completed;
    
    if (task.completed) {
      task.completedAt = new Date();
      task.completedBy = req.payload._id;
    } else {
      task.completedAt = undefined;
      task.completedBy = undefined;
    }
    
    await task.save();
    
    const populatedTask = await populateTask(task._id);
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando el estado de la tarea", error: error.message });
  }
});

// Añadir un comentario a la tarea
router.post("/:id/comments", isAuthenticated, loadTask, getShelterContext, requireShelterMember, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "El contenido del comentario es obligatorio" });
    }
    
    const task = req.task;
    
    task.comments.push({
      content,
      author: req.payload._id
    });
    
    await task.save();
    
    const populatedTask = await populateTask(task._id);
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error añadiendo el comentario", error: error.message });
  }
});

// Eliminar un comentario propio o como admin
router.delete("/:id/comments/:commentId", isAuthenticated, loadTask, getShelterContext, requireShelterMember, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.payload._id;
    const task = req.task;
    const isAdmin = req.shelter.permissions.isAdmin;
    
    // Buscar el comentario
    const comment = task.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }
    
    // Verificar que el usuario es el autor del comentario o es admin
    if (comment.author.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Solo puedes eliminar tus propios comentarios o ser administrador" });
    }
    
    // Eliminar el comentario
    comment.remove();
    await task.save();
    
    res.json({ message: "Comentario eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando el comentario", error: error.message });
  }
});

//==============================================================================
// RUTAS SOLO PARA ADMINS (requieren ser administrador de la protectora)
//==============================================================================

// Crear una nueva tarea
router.post("/", isAuthenticated, getShelterContext, requireShelterAdmin, async (req, res) => {
  try {
    const { title, description, tag, priority } = req.body;
    const shelterId = req.shelter.id;
    
    const newTask = new Task({
      title,
      description,
      tag,
      priority,
      shelter: shelterId,
      createdBy: req.payload._id
    });
    
    await newTask.save();
    
    // Actualizar la referencia en el modelo Shelter
    await Shelter.findByIdAndUpdate(shelterId, { 
      $push: { tasks: newTask._id } 
    });
    
    // Poblar los campos de relación
    const populatedTask = await populateTask(newTask._id);
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error creando la tarea", error: error.message });
  }
});

// Actualizar una tarea existente
router.put("/:id", isAuthenticated, loadTask, getShelterContext, requireShelterAdmin, async (req, res) => {
  try {
    const { title, description, tag, priority } = req.body;
    const taskId = req.params.id;
    
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { title, description, tag, priority },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    const populatedTask = await populateTask(updatedTask._id);
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando la tarea", error: error.message });
  }
});

// Eliminar una tarea
router.delete("/:id", isAuthenticated, loadTask, getShelterContext, requireShelterAdmin, async (req, res) => {
  try {
    const taskId = req.params.id;
    const shelterId = req.task.shelter;
    
    const result = await Task.findByIdAndDelete(taskId);
    
    if (!result) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    // Actualizar la referencia en el modelo Shelter
    await Shelter.findByIdAndUpdate(shelterId, { 
      $pull: { tasks: taskId } 
    });
    
    res.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando la tarea", error: error.message });
  }
});

module.exports = router;