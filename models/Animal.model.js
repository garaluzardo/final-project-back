const { Schema, model } = require("mongoose");

const animalSchema = new Schema(
  {
    name: {type: String}, description: {type: String}
  }
);

const Animal = model("Animal", animalSchema);

module.exports = Animal;