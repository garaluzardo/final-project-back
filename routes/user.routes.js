const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const bcrypt = require("bcrypt");
const saltRounds = 10;

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

// Ruta para eliminar un usuario (requiere autenticación)
router.delete("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  
  // Verificar que el usuario solo pueda eliminar su propio perfil
  if (req.payload._id !== id) {
    return res.status(403).json({ message: "You can only delete your own profile" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User successfully deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting the user", error: error.message });
  }
});

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

module.exports = router;