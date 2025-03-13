const express = require("express");
const router = express.Router();
const Task = require("../models/Task.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Middlewares personalizados para verificar permisos
const isShelterMember = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('shelter');
    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    // Guardar la tarea en el request para no buscarla de nuevo
    req.task = task;
    
    // Verificar si el usuario es admin o voluntario de la protectora
    const userId = req.payload._id;
    const shelter = task.shelter;
    
    if (shelter.admins.includes(userId) || shelter.volunteers.includes(userId)) {
      req.isShelterAdmin = shelter.admins.includes(userId);
      return next();
    }
    
    return res.status(403).json({ message: "No tienes permisos para esta acción" });
  } catch (error) {
    return res.status(500).json({ message: "Error de servidor", error: error.message });
  }
};

// Middleware para verificar si es admin de la protectora
const isShelterAdmin = (req, res, next) => {
  if (req.isShelterAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Esta acción requiere permisos de administrador" });
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
    const task = await Task.findById(req.params.id)
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
router.patch("/:id/toggle-complete", isAuthenticated, isShelterMember, async (req, res) => {
  try {
    const task = req.task; // Viene del middleware isShelterMember
    
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
    
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name handle profilePicture')
      .populate('completedBy', 'name handle profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name handle profilePicture'
        }
      });
    
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando el estado de la tarea", error: error.message });
  }
});

// Añadir un comentario a la tarea
router.post("/:id/comments", isAuthenticated, isShelterMember, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: "El contenido del comentario es obligatorio" });
    }
    
    const task = req.task; // Viene del middleware isShelterMember
    
    task.comments.push({
      content,
      author: req.payload._id
    });
    
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name handle profilePicture')
      .populate('completedBy', 'name handle profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name handle profilePicture'
        }
      });
    
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error añadiendo el comentario", error: error.message });
  }
});

// Eliminar un comentario propio
router.delete("/:id/comments/:commentId", isAuthenticated, isShelterMember, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.payload._id;
    const task = req.task; // Viene del middleware isShelterMember
    
    // Buscar el comentario
    const comment = task.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }
    
    // Verificar que el usuario es el autor del comentario o es admin
    if (comment.author.toString() !== userId && !req.isShelterAdmin) {
      return res.status(403).json({ message: "Solo puedes eliminar tus propios comentarios" });
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
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { title, description, tag, priority, shelter } = req.body;
    
    // Aquí deberíamos verificar si el usuario es admin de la protectora
    // Por simplicidad, podríamos hacer esto en un middleware separado
    
    const newTask = new Task({
      title,
      description,
      tag,
      priority,
      shelter,
      createdBy: req.payload._id
    });
    
    await newTask.save();
    
    // También deberíamos actualizar la referencia en el modelo Shelter
    // await Shelter.findByIdAndUpdate(shelter, { $push: { tasks: newTask._id } });
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Error creando la tarea", error: error.message });
  }
});

// Actualizar una tarea existente
router.put("/:id", isAuthenticated, isShelterMember, isShelterAdmin, async (req, res) => {
  try {
    const { title, description, tag, priority } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, tag, priority },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name handle profilePicture')
    .populate('completedBy', 'name handle profilePicture')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'name handle profilePicture'
      }
    });
    
    if (!updatedTask) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando la tarea", error: error.message });
  }
});

// Eliminar una tarea
router.delete("/:id", isAuthenticated, isShelterMember, isShelterAdmin, async (req, res) => {
  try {
    const task = req.task; // Viene del middleware isShelterMember
    const result = await Task.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }
    
    // También deberíamos actualizar la referencia en el modelo Shelter
    // await Shelter.findByIdAndUpdate(task.shelter, { $pull: { tasks: task._id } });
    
    res.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando la tarea", error: error.message });
  }
});

module.exports = router;