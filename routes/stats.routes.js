const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Shelter = require("../models/Shelter.model");

// Ruta para obtener estadísticas generales (número de usuarios y protectoras)
router.get("/general", async (req, res) => {
  try {
    // Contar usuarios y protectoras
    const [usersCount, sheltersCount] = await Promise.all([
      User.countDocuments(),
      Shelter.countDocuments()
    ]);

    res.json({
      usersCount,
      sheltersCount
    });
  } catch (error) {
    console.error("Error al obtener estadísticas generales:", error);
    res.status(500).json({ 
      message: "Error al obtener estadísticas generales", 
      error: error.message 
    });
  }
});

module.exports = router;