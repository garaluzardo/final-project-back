const { Schema, model } = require("mongoose");

const shelterSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la protectora es obligatorio"],
      trim: true
    },
    handle: {
      type: String,
      required: [true, "El handle de la protectora es obligatorio"],
      trim: true,
      match: [/^[a-zA-Z0-9_.]+$/, "El handle solo puede contener letras, números, guiones bajos y puntos"]
    },
    bio: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    contact: {
      email: { type: String },
      phone: { type: String },
      website: { type: String }
    },
    socialMedia: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String }
    },
    admins: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    volunteers: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    animals: [{
      type: Schema.Types.ObjectId,
      ref: "Animal"
    }],
    tasks: [{
      type: Schema.Types.ObjectId,
      ref: "Task"
    }]
  },
  {
    timestamps: true
  }
);

// Crear índice para búsquedas rápidas por handle
shelterSchema.index({ handle: 1 }, { unique: true });

const Shelter = model("Shelter", shelterSchema);

module.exports = Shelter;