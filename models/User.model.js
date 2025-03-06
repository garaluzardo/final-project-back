const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: [true, "Este nombre de usuario ya está en uso"],
      trim: true,
      match: [/^[a-zA-Z0-9_.]+$/, "El nombre de usuario solo puede contener letras, números, guiones bajos y puntos"],
      maxlength: [15, "El nombre de usuario no puede superar los 15 caracteres"]
    },
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: [15, "El nombre no puede superar los 15 caracteres"]
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: [true, "Este email ya está en uso"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor, introduce un email válido"]
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    profileImage: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [250, "La biografía no puede superar los 250 caracteres"]
    },
    isGlobalAdmin: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password; // Eliminar la contraseña al convertir a JSON
        return ret;
      }
    }
  }
);

// Virtual para obtener fácilmente las membresías del usuario
userSchema.virtual('memberships', {
  ref: 'Membership',
  localField: '_id',
  foreignField: 'user'
});

const User = model("User", userSchema);

module.exports = User;
