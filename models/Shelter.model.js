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
      unique: true,
      lowercase: true,
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
      // Dirección completa para mostrar en la UI
      fullAddress: { 
        type: String,
        default: ""
      },
      // Ciudad (Madrid, Barcelona, Valencia...)
      city: { 
        type: String,
        default: "",
        trim: true,
        index: true // Índice para búsquedas rápidas por ciudad
      },
      // Municipio (Getafe, Alcobendas, L'Hospitalet...)
      municipality: { 
        type: String,
        default: "",
        trim: true,
        index: true
      },
      // Provincia (Madrid, Barcelona, Valencia...)
      province: { 
        type: String,
        default: "",
        trim: true,
        index: true
      },
      // Isla (Mallorca, Tenerife, Gran Canaria...)
      island: { 
        type: String,
        default: "",
        trim: true,
        index: true
      },
      // Código postal
      postalCode: { 
        type: String,
        default: "",
        trim: true
      },
      // Coordenadas para geolocalización (formato GeoJSON para MongoDB)
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitud, latitud]
          default: [0, 0]
        }
      }
    },
    contact: {
      email: { 
        type: String,
        trim: true,
        lowercase: true 
      },
      phone: { 
        type: String,
        trim: true 
      },
      website: { 
        type: String,
        trim: true 
      }
    },
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true }
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

// Crea índice para búsquedas rápidas por handle
shelterSchema.index({ handle: 1 }, { unique: true });

// Índice de texto para búsquedas por términos en dirección y nombre
shelterSchema.index({ 
  name: 'text',
  'location.fullAddress': 'text', 
  'location.city': 'text', 
  'location.municipality': 'text',
  'location.island': 'text'
});

// Índice geoespacial para búsquedas por proximidad
shelterSchema.index({ 'location.coordinates': '2dsphere' });

const Shelter = model("Shelter", shelterSchema);

module.exports = Shelter;