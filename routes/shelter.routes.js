const express = require("express");
const router = express.Router();
const Shelter = require("../models/Shelter.model");
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Ruta para obtener todas las protectoras (público)
router.get("/", async (req, res) => {
  try {
    const shelters = await Shelter.find()
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl")
      .populate("animals")
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación (más recientes primero)

    res.json(shelters);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error obteniendo las protectoras",
        error: error.message,
      });
  }
});

// Ruta para obtener una protectora específica por su id (público)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const shelter = await Shelter.findById(id)
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl")
      .populate("animals")
      .populate({
        path: "tasks",
        populate: {
          path: "completedBy",
          select: "name username imageUrl",
        },
      });

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error obteniendo la protectora",
        error: error.message,
      });
  }
});

// Ruta para obtener una protectora por su handle (público)
router.get("/handle/:handle", async (req, res) => {
  const { handle } = req.params;

  try {
    const shelter = await Shelter.findOne({ handle })
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl")
      .populate("animals")
      .populate({
        path: "tasks",
        populate: {
          path: "completedBy",
          select: "name username imageUrl",
        },
      });

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error obteniendo la protectora",
        error: error.message,
      });
  }
});

// Ruta para crear una nueva protectora (requiere autenticación)
router.post("/", isAuthenticated, async (req, res) => {
  const { name, handle, bio, imageUrl, location, contact, socialMedia } =
    req.body;

  try {
    console.log("Datos recibidos:", req.body);
    console.log("Usuario autenticado:", req.payload);

    // Verificar que req.payload._id existe
    if (!req.payload || !req.payload._id) {
      console.error("Payload inválido:", req.payload);
      return res
        .status(400)
        .json({ message: "Información de autenticación inválida" });
    }

    const userId = req.payload._id;
    console.log("ID de usuario:", userId);

    // Verificar si el handle ya existe
    const existingShelter = await Shelter.findOne({ handle });
    if (existingShelter) {
      return res
        .status(400)
        .json({ message: "El handle ya está en uso. Por favor, elige otro." });
    }

    // Crear la protectora con el usuario actual como administrador
    const shelterData = {
      name,
      handle,
      bio,
      imageUrl,
      location,
      contact,
      socialMedia,
      admins: [userId],
      volunteers: [],
      animals: [],
      tasks: [],
    };

    console.log("Datos de la protectora a crear:", shelterData);

    const newShelter = new Shelter(shelterData);
    await newShelter.save();

    console.log("Protectora creada:", newShelter);

    // Añadir la referencia a la protectora en el usuario
    await User.findByIdAndUpdate(userId, {
      $push: { ownedShelters: newShelter._id },
    });

    // Obtener la protectora con sus relaciones pobladas
    const populatedShelter = await Shelter.findById(newShelter._id).populate(
      "admins",
      "name username imageUrl"
    );

    res.status(201).json(populatedShelter);
  } catch (error) {
    console.error("Error detallado al crear la protectora:", error);
    console.error("Stack del error:", error.stack);
    res
      .status(500)
      .json({ message: "Error creando la protectora", error: error.message });
  }
});

// Ruta para actualizar una protectora (solo administradores)
router.put("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.payload._id;
  const { name, handle, bio, imageUrl, location, contact, socialMedia } =
    req.body;

  try {
    // Verificar si el usuario es administrador de esta protectora
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    if (!shelter.admins.includes(userId)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para editar esta protectora" });
    }

    // Verificar si el nuevo handle ya existe (solo si se está cambiando)
    if (handle !== shelter.handle) {
      const existingHandle = await Shelter.findOne({ handle });
      if (existingHandle) {
        return res
          .status(400)
          .json({
            message: "El handle ya está en uso. Por favor, elige otro.",
          });
      }
    }

    const updatedShelter = await Shelter.findByIdAndUpdate(
      id,
      {
        name,
        handle,
        bio,
        imageUrl,
        location,
        contact,
        socialMedia,
      },
      { new: true }
    )
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl");

    res.status(200).json(updatedShelter);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error actualizando la protectora",
        error: error.message,
      });
  }
});

// Ruta para eliminar una protectora (solo administradores)
router.delete("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    // Verificar si el usuario es administrador de esta protectora
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    if (!shelter.admins.includes(userId)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para eliminar esta protectora" });
    }

    // Eliminar la protectora
    await Shelter.findByIdAndDelete(id);

    // Eliminar la referencia de la protectora en todos los usuarios
    await User.updateMany(
      { $or: [{ ownedShelters: id }, { joinedShelters: id }] },
      {
        $pull: {
          ownedShelters: id,
          joinedShelters: id,
        },
      }
    );

    // También deberíamos eliminar las tareas y posiblemente los animales asociados
    // (esto depende de tus requisitos específicos)

    res.json({ message: "Protectora eliminada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error eliminando la protectora",
        error: error.message,
      });
  }
});

// Ruta para unirse a una protectora como voluntario (requiere autenticación)
router.post("/:id/join", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    // Verificar si el usuario ya es administrador (no puede ser voluntario y admin)
    if (shelter.admins.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Ya eres administrador de esta protectora" });
    }

    // Verificar si el usuario ya es voluntario
    if (shelter.volunteers.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Ya eres voluntario de esta protectora" });
    }

    // Añadir usuario como voluntario
    const updatedShelter = await Shelter.findByIdAndUpdate(
      id,
      { $push: { volunteers: userId } },
      { new: true }
    )
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl");

    // Añadir la referencia de la protectora al usuario
    await User.findByIdAndUpdate(userId, { $push: { joinedShelters: id } });

    res.json(updatedShelter);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al unirse a la protectora",
        error: error.message,
      });
  }
});

// Ruta para abandonar una protectora (solo voluntarios)
router.post("/:id/leave", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    // Verificar si el usuario es administrador (no puede abandonar si es admin)
    if (shelter.admins.includes(userId)) {
      return res
        .status(400)
        .json({
          message:
            "No puedes abandonar como administrador. Transfiere la administración primero.",
        });
    }

    // Verificar si el usuario es voluntario
    if (!shelter.volunteers.includes(userId)) {
      return res
        .status(400)
        .json({ message: "No eres voluntario de esta protectora" });
    }

    // Eliminar usuario de la lista de voluntarios
    const updatedShelter = await Shelter.findByIdAndUpdate(
      id,
      { $pull: { volunteers: userId } },
      { new: true }
    )
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl");

    // Eliminar la referencia de la protectora del usuario
    await User.findByIdAndUpdate(userId, { $pull: { joinedShelters: id } });

    res.json(updatedShelter);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al abandonar la protectora",
        error: error.message,
      });
  }
});

// Ruta para añadir un administrador (solo administradores)
router.post("/:id/admins/:userId", isAuthenticated, async (req, res) => {
  const { id, userId: newAdminId } = req.params;
  const requestingUserId = req.payload._id;

  try {
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    // Verificar si el usuario que hace la solicitud es administrador
    if (!shelter.admins.includes(requestingUserId)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para añadir administradores" });
    }

    // Verificar si el usuario a añadir existe
    const userToAdd = await User.findById(newAdminId);
    if (!userToAdd) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si el usuario ya es admin, no hacer nada
    if (shelter.admins.includes(newAdminId)) {
      return res
        .status(400)
        .json({ message: "El usuario ya es administrador" });
    }

    // Si el usuario es voluntario, quitarlo de esa lista
    let update = { $push: { admins: newAdminId } };
    if (shelter.volunteers.includes(newAdminId)) {
      update.$pull = { volunteers: newAdminId };
    }

    // Añadir el usuario como administrador
    const updatedShelter = await Shelter.findByIdAndUpdate(id, update, {
      new: true,
    })
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl");

    // Actualizar referencias en el usuario
    await User.findByIdAndUpdate(newAdminId, {
      $addToSet: { ownedShelters: id },
      $pull: { joinedShelters: id }, // Si ya estaba como voluntario
    });

    res.json(updatedShelter);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al añadir administrador", error: error.message });
  }
});

// Ruta para quitar un administrador (solo administradores)
router.delete("/:id/admins/:userId", isAuthenticated, async (req, res) => {
  const { id, userId: adminToRemoveId } = req.params;
  const requestingUserId = req.payload._id;

  try {
    // Verificar si la protectora existe
    const shelter = await Shelter.findById(id);
    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    // Verificar si el usuario que hace la solicitud es administrador
    if (!shelter.admins.includes(requestingUserId)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para quitar administradores" });
    }

    // No se puede quitar a uno mismo si es el único administrador
    if (
      adminToRemoveId === requestingUserId.toString() &&
      shelter.admins.length === 1
    ) {
      return res
        .status(400)
        .json({
          message: "No puedes quitarte como administrador porque eres el único",
        });
    }

    // Verificar si el usuario a quitar es administrador
    if (!shelter.admins.includes(adminToRemoveId)) {
      return res
        .status(400)
        .json({ message: "El usuario no es administrador de esta protectora" });
    }

    // Quitar el usuario como administrador
    const updatedShelter = await Shelter.findByIdAndUpdate(
      id,
      { $pull: { admins: adminToRemoveId } },
      { new: true }
    )
      .populate("admins", "name username imageUrl")
      .populate("volunteers", "name username imageUrl");

    // Quitar la referencia de la protectora en el usuario
    await User.findByIdAndUpdate(adminToRemoveId, {
      $pull: { ownedShelters: id },
    });

    res.json(updatedShelter);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al quitar administrador", error: error.message });
  }
});

// Obtener lista de tareas de una protectora
router.get("/:id/tasks", async (req, res) => {
  const { id } = req.params;

  try {
    const shelter = await Shelter.findById(id).populate({
      path: "tasks",
      populate: {
        path: "completedBy",
        select: "name username imageUrl",
      },
    });

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter.tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo tareas", error: error.message });
  }
});

// Obtener lista de animales de una protectora
router.get("/:id/animals", async (req, res) => {
  const { id } = req.params;

  try {
    const shelter = await Shelter.findById(id).populate("animals");

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter.animals);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo animales", error: error.message });
  }
});

// Obtener lista de administradores de una protectora
router.get("/:id/admins", async (req, res) => {
  const { id } = req.params;

  try {
    const shelter = await Shelter.findById(id).populate(
      "admins",
      "name username imageUrl"
    );

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter.admins);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error obteniendo administradores",
        error: error.message,
      });
  }
});

// Obtener lista de voluntarios de una protectora
router.get("/:id/volunteers", async (req, res) => {
  const { id } = req.params;

  try {
    const shelter = await Shelter.findById(id).populate(
      "volunteers",
      "name username imageUrl"
    );

    if (!shelter) {
      return res.status(404).json({ message: "Protectora no encontrada" });
    }

    res.json(shelter.volunteers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo voluntarios", error: error.message });
  }
});

module.exports = router;
