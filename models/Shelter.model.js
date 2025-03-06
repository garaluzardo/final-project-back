const { Schema, model } = require("mongoose");

const shelterSchema = new Schema(
  {
    name: {type: String}, description: {type: String}
  }
);

const Shelter = model("Shelter", shelterSchema);

module.exports = Shelter;