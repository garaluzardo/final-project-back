const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título de la tarea es obligatorio"],
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    tag: {
      type: String,
      required: [true, "La etiqueta de la tarea es obligatorio"],
      enum: ["health", "food", "cleaning", "exercise", "other"],
      default: "other"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true
    },
    shelter: {
      type: Schema.Types.ObjectId,
      ref: "Shelter",
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    comments: [commentSchema]
  },
  {
    timestamps: true
  }
);

// Índices para mejorar el rendimiento de las consultas
taskSchema.index({ shelter: 1, completedAt: -1 }); // Para buscar tareas de un refugio ordenadas por fecha de completado
taskSchema.index({ shelter: 1, tag: 1 }); // Para filtrar por etiquetas
taskSchema.index({ shelter: 1, completed: 1 }); // Para filtrar por estado
taskSchema.index({ completedBy: 1 }); // Para buscar tareas completadas por un usuario específico

const Task = model("Task", taskSchema);

module.exports = Task;