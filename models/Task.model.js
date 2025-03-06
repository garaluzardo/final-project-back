const { Schema, model } = require("mongoose");

const taskSchema = new Schema(
  {
    title: {type: String}, description: {type: String}
  }
);

const Task = model("Task", taskSchema);

module.exports = Task;
