const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Shelter = require("../models/Shelter.model");
const Task = require("../models/Task.model");
const Animal = require("../models/Animal.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//==============================================================================
// RUTAS ESTÁTICAS (sin parámetros dinámicos)
//==============================================================================

// Ruta para obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    // Proyección para excluir el password en las respuestas
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error obtaining users", error: error.message });
  }
});

// Ruta para crear un nuevo usuario
// Nota: Esta ruta probablemente no se usará directamente ya que el registro
// se hace a través de auth.routes.js, pero se mantiene por completitud
router.post("/", async (req, res) => {
  const { name, email, password, handle, bio, profilePicture, location } = req.body;

  try {
    // Verificar si el handle ya existe
    const existingHandle = await User.findOne({ handle });
    if (existingHandle) {
      return res.status(400).json({ message: "Handle already in use. Please choose another one." });
    }

    const newUser = new User({ 
      name, 
      email, 
      password, 
      handle, 
      bio, 
      profilePicture, 
      location 
    });
    
    await newUser.save();
    
    // Excluir el password en la respuesta
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating the user", error: error.message });
  }
});

//==============================================================================
// RUTAS CON PARÁMETROS ESPECÍFICOS (handle/:handle)
//==============================================================================

// Ruta para obtener un usuario por su handle
router.get("/handle/:handle", async (req, res) => {
  const { handle } = req.params;

  try {
    const user = await User.findOne({ handle })
      .select("-password")
      .populate("ownedShelters")
      .populate("joinedShelters")
      .populate("completedTasks");
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining the user", error: error.message });
  }
});

//==============================================================================
// RUTAS DE RECURSOS ANIDADOS (/:id/resource)
//==============================================================================

// Ruta para obtener las protectoras administradas por el usuario
router.get("/:id/owned-shelters", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate("ownedShelters");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.ownedShelters);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining user's shelters", error: error.message });
  }
});

// Ruta para obtener las protectoras a las que pertenece el usuario
router.get("/:id/joined-shelters", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate("joinedShelters");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.joinedShelters);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining user's shelters", error: error.message });
  }
});

// Ruta para obtener las tareas completadas por el usuario
router.get("/:id/completed-tasks", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate({
      path: "completedTasks",
      populate: {
        path: "shelter",
        select: "name handle"
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.completedTasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining user's tasks", error: error.message });
  }
});

// Ruta para obtener las tareas creadas por el usuario
router.get("/:id/created-tasks", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate({
      path: "createdTasks",
      populate: {
        path: "shelter",
        select: "name handle"
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.createdTasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining user's created tasks", error: error.message });
  }
});

// Ruta para actualizar la contraseña del usuario (requiere autenticación)
router.put("/:id/password", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  // Verificar que el usuario solo pueda actualizar su propia contraseña
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only update your own password" });
  }

  try {
    // Buscar al usuario para verificar la contraseña actual
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verificar que la contraseña actual sea correcta
    const passwordIsCorrect = bcrypt.compareSync(currentPassword, user.password);
    
    if (!passwordIsCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Validar la nueva contraseña
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "New password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter."
      });
    }

    // Hashear la nueva contraseña
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(id, { password: hashedPassword });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password", error: error.message });
  }
});

// Nueva ruta para verificar estado de administración antes de eliminar cuenta
router.get("/:id/admin-status", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  
  // Verificar que solo el propio usuario pueda consultar su estado
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only check your own admin status" });
  }

  try {
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Obtener todas las protectoras donde el usuario es administrador
    const administeredShelters = await Shelter.find({ admins: id });

    // Verificar cada protectora si el usuario es el único administrador
    const soloAdminShelters = [];
    
    for (const shelter of administeredShelters) {
      if (shelter.admins.length === 1) {
        // Si solo hay un admin (este usuario), añadir a la lista
        soloAdminShelters.push({
          _id: shelter._id,
          name: shelter.name,
          handle: shelter.handle,
          volunteers: shelter.volunteers,
          // Solo incluir voluntarios que no sean el usuario actual
          eligibleAdmins: shelter.volunteers.filter(volId => volId.toString() !== id)
        });
      }
    }

    // Responder con el estado
    res.json({
      isLastAdminForShelters: soloAdminShelters.length > 0,
      soloAdminShelters: soloAdminShelters,
      regularShelters: administeredShelters.filter(s => s.admins.length > 1).map(s => ({
        _id: s._id,
        name: s.name,
        handle: s.handle
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error checking admin status", 
      error: error.message 
    });
  }
});

//==============================================================================
// RUTAS CRUD BÁSICAS CON PARÁMETROS DINÁMICOS GENERALES (/:id)
//==============================================================================

// Ruta para obtener un usuario específico por su id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
      .select("-password") // Excluir el password
      .populate("ownedShelters")
      .populate("joinedShelters")
      .populate("completedTasks");
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obtaining the user", error: error.message });
  }
});

// Ruta para actualizar parcialmente un usuario (requiere autenticación)
router.patch("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Todos los campos enviados en la solicitud
  
  // Verificar que el usuario solo pueda actualizar su propio perfil
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only update your own profile" });
  }

  try {
    // Si se está actualizando el handle, verificar que no exista
    if (updateFields.handle) {
      const existingHandle = await User.findOne({ handle: updateFields.handle, _id: { $ne: id } });
      if (existingHandle) {
        return res.status(400).json({ message: "Handle already in use. Please choose another one." });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields }, // Usar $set para actualizar solo los campos proporcionados
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating the user", error: error.message });
  }
});

// Ruta para actualizar un usuario (requiere autenticación)
router.put("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { name, bio, profilePicture, location, handle } = req.body;
  
  // Verificar que el usuario solo pueda actualizar su propio perfil
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only update your own profile" });
  }

  try {
    // Si se está actualizando el handle, verificar que no exista
    if (handle) {
      const existingHandle = await User.findOne({ handle, _id: { $ne: id } });
      if (existingHandle) {
        return res.status(400).json({ message: "Handle already in use. Please choose another one." });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, bio, profilePicture, location, handle },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating the user", error: error.message });
  }
});

// Ruta para eliminar un usuario (requiere autenticación)
router.delete("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { confirmDelete, newAdminAssignments } = req.body;
  
  // Verificar que el usuario solo pueda eliminar su propio perfil
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only delete your own profile" });
  }

  try {
    // Primero verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Encontrar protectoras donde este usuario es el único admin
    const soloAdminShelters = await Shelter.find({ 
      admins: { $size: 1, $elemMatch: { $eq: id } }
    });

    // Si hay protectoras donde es el único admin, verificar que la acción está confirmada
    if (soloAdminShelters.length > 0 && !confirmDelete) {
      return res.status(400).json({
        message: "You are the only administrator for one or more shelters. Please confirm deletion.",
        requiresConfirmation: true,
        soloAdminShelters: soloAdminShelters.map(s => ({
          _id: s._id,
          name: s.name,
          handle: s.handle
        }))
      });
    }

    // Si se proporcionaron asignaciones de nuevos admins, procesarlas
    if (newAdminAssignments && Object.keys(newAdminAssignments).length > 0) {
      for (const [shelterId, newAdminId] of Object.entries(newAdminAssignments)) {
        // Verificar que la protectora existe
        const shelter = await Shelter.findById(shelterId);
        if (!shelter) {
          continue; // Saltarse si la protectora no existe
        }

        // Verificar que el usuario actual es admin de esta protectora
        if (!shelter.admins.includes(id)) {
          continue; // Saltarse si no es admin
        }

        // Verificar que el nuevo admin es voluntario de esta protectora
        if (!shelter.volunteers.includes(newAdminId)) {
          continue; // Saltarse si no es voluntario
        }

        // Añadir el nuevo admin y quitar de voluntarios
        await Shelter.findByIdAndUpdate(shelterId, {
          $push: { admins: newAdminId },
          $pull: { volunteers: newAdminId }
        });

        // Actualizar referencias en el usuario que se convierte en admin
        await User.findByIdAndUpdate(newAdminId, {
          $push: { ownedShelters: shelterId },
          $pull: { joinedShelters: shelterId }
        });
      }
    }

    // Para cada protectora donde el usuario sea el único admin y no se asignó un nuevo admin,
    // eliminar la protectora y datos relacionados
    for (const shelter of soloAdminShelters) {
      const shelterId = shelter._id;
      
      // Verificar si se asignó un nuevo admin a esta protectora
      if (newAdminAssignments && newAdminAssignments[shelterId]) {
        // Si se asignó un nuevo admin, la protectora ya fue actualizada
        continue;
      }

      // No se asignó admin, eliminar la protectora y datos relacionados
      // 1. Eliminar todas las tareas asociadas a la protectora
      if (shelter.tasks && shelter.tasks.length > 0) {
        await Task.deleteMany({ _id: { $in: shelter.tasks } });
      }

      // 2. Eliminar todos los animales asociados a la protectora
      if (shelter.animals && shelter.animals.length > 0) {
        await Animal.deleteMany({ _id: { $in: shelter.animals } });
      }

      // 3. Eliminar la protectora
      await Shelter.findByIdAndDelete(shelterId);

      // 4. Eliminar la referencia de la protectora en todos los usuarios
      await User.updateMany(
        { $or: [{ ownedShelters: shelterId }, { joinedShelters: shelterId }] },
        {
          $pull: {
            ownedShelters: shelterId,
            joinedShelters: shelterId
          }
        }
      );
    }

    // Ahora, eliminar el usuario
    const deletedUser = await User.findByIdAndDelete(id);

    // Quitar al usuario como admin o voluntario de todas las protectoras
    await Shelter.updateMany(
      { $or: [{ admins: id }, { volunteers: id }] },
      {
        $pull: {
          admins: id,
          volunteers: id
        }
      }
    );

    res.status(200).json({ 
      message: "User successfully deleted",
      deletedShelters: soloAdminShelters
        .filter(s => !(newAdminAssignments && newAdminAssignments[s._id]))
        .map(s => ({ _id: s._id, name: s.name }))
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting the user", error: error.message });
  }
});

module.exports = router;