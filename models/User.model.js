const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters long and contain at least one number, one lowercase and one uppercase letter."],
    },
    name: {
      type: String,
      default: "",
    },
    handle: {
      type: String,
      required: [true, "Handle is required."],
      unique: true,
      trim: true,
      lowercase: true, // Asegura unicidad independiente de mayúsculas/minúsculas
      maxlength: [15, "Handle cannot be more than 15 characters long."],
      match: [/^[a-zA-Z0-9_.]+$/, "Handle can only contain letters, numbers, underscores and dots."],
    },
    bio: {
      type: String,
      default: "",
      maxlength: [300, "Bio cannot be more than 300 characters long."],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    // Estructura para location - solo informativa, no para búsquedas
    location: {
      city: { 
        type: String,
        default: "",
        trim: true
      },
      municipality: { 
        type: String,
        default: "",
        trim: true
      },
      province: { 
        type: String,
        default: "",
        trim: true
      },
      island: { 
        type: String,
        default: "",
        trim: true
      },
      postalCode: { 
        type: String,
        default: "",
        trim: true
      }
    },
    // Referencias a otras colecciones
    ownedShelters: [{
      type: Schema.Types.ObjectId,
      ref: "Shelter"
    }],
    joinedShelters: [{
      type: Schema.Types.ObjectId,
      ref: "Shelter"
    }],
    // Tareas en las que el usuario está involucrado
    completedTasks: [{
      type: Schema.Types.ObjectId,
      ref: "Task"
    }],
    createdTasks: [{
      type: Schema.Types.ObjectId,
      ref: "Task"
    }]
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas eficientes - solo los esenciales
userSchema.index({ handle: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

const User = model("User", userSchema);

module.exports = User;