const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
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
      minlength: [6, "Password must be at least 6 characters long."],
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
    location: {
      type: String,
      default: "",
    },
    // References to other collections
    ownedShelters: [{
      type: Schema.Types.ObjectId,
      ref: "Shelter"
    }],
    joinedShelters: [{
      type: Schema.Types.ObjectId,
      ref: "Shelter"
    }],
    completedTasks: [{
      type: Schema.Types.ObjectId,
      ref: "Task"
    }],
    // Role information can be derived from shelter memberships
    // Admin status is determined by being in the admins array of a shelter
    // Volunteer status is determined by being in the volunteers array of a shelter
  },
  {
    // This adds `createdAt` and `updatedAt` properties
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;