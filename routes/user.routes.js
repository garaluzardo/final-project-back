const express = require("express");
const router = express.Router();
const User = require("../models/User.model");

// Ruta para obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo usuarios" });
  }
});

// Ruta para obtener un usuario específico por su id
router.get("/:id", async (req, res) => {
  const { id } = req.params; // Obtenemos el id desde la URL

  try {
    const user = await User.findById(id); // Buscamos el usuario por su id
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user); // Respondemos con el usuario encontrado
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo el usuario", error: error.message });
  }
});

// Ruta para crear un nuevo usuario
router.post("/", async (req, res) => {
  const { name, email, password } = req.body; // Datos que se envían en el cuerpo de la solicitud
  console.log("Datos recibidos:", req.body);

  try {
    const newUser = new User({ name, email, password }); // Crea una nueva instancia del modelo User
    await newUser.save(); // Guarda el nuevo usuario en la base de datos
    res.status(201).json(newUser); // Devuelve el usuario creado con un código 201
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al crear el usuario", error: error.message });
  }
});

// Ruta para actualizar un usuario
router.put("/:id", async (req, res) => {
  const { id } = req.params; // Obtener el ID desde la URL
  const { name, email, password } = req.body; // Obtener los datos a actualizar

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, password },
      { new: true } // Devuelve el usuario actualizado
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error actualizando el usuario", error: error.message });
  }
});

// Ruta para eliminar un usuario
router.delete("/:id", async (req, res) => {
  const { id } = req.params; // Obtener el ID desde la URL

  try {
    const deletedUser = await User.findByIdAndDelete(id); // Eliminar el usuario por ID

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error eliminando el usuario", error: error.message });
  }
});

module.exports = router;
