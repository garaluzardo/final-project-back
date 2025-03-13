const { Schema, model } = require("mongoose");

const animalSchema = new Schema(
  {
    // Datos básicos
    name: {
      type: String,
      required: [true, "El nombre del animal es obligatorio"],
      trim: true
    },
    species: {
      type: String,
      required: [true, "La especie del animal es obligatoria"],
      enum: ["Perro", "Gato", "Conejo", "Ave", "Roedor", "Reptil", "Otro"],
      default: "Perro"
    },
    breed: {
      type: String,
      trim: true,
      default: "Mestizo/Desconocida"
    },
    description: {
      type: String,
      trim: true
    },
    
    // Características físicas
    age: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      enum: ["Macho", "Hembra", "Desconocido"],
      required: [true, "El género del animal es obligatorio"]
    },
    size: {
      type: String,
      enum: ["Pequeño", "Mediano", "Grande", "Gigante"],
      default: "Mediano"
    },
    color: {
      type: String,
      trim: true
    },
    
    // Estado y cuidados
    status: {
      type: String,
      enum: ["Disponible", "En proceso de adopción", "Adoptado", "Acogida temporal"],
      default: "Disponible",
      required: true
    },
    sterilized: {
      type: Boolean,
      default: false
    },
    vaccinated: {
      type: Boolean,
      default: false
    },
    microchipped: {
      type: Boolean,
      default: false
    },
    
    // Imagen principal
    imageUrl: {
      type: String,
      trim: true
    },
    
    // Fechas importantes
    arrivalDate: {
      type: Date,
      default: Date.now
    },
    
    // Relaciones
    shelter: {
      type: Schema.Types.ObjectId,
      ref: "Shelter",
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Información adicional
    notes: {
      type: String,
      trim: true
    }
  },
  
  { timestamps: true }
);

const Animal = model("Animal", animalSchema);

module.exports = Animal;