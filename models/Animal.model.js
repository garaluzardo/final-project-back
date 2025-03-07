const { Schema, model } = require("mongoose");

const animalSchema = new Schema(
  {
    name: {type: String},
    description: {type: String},
    age: {type: Number},
    gender: {type: String},
    species: {type: String}
  }
);

const Animal = model("Animal", animalSchema);

module.exports = Animal;