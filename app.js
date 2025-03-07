// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db/index");

// Importamos los modelos
require("./models/Animal.model");
require("./models/Shelter.model");
require("./models/Task.model");
require("./models/User.model");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const animalRoutes = require("./routes/animal.routes"); 
app.use("/api/animals", animalRoutes);

const shelterRoutes = require("./routes/shelter.routes"); 
app.use("/api/shelters", shelterRoutes);

const taskRoutes = require("./routes/task.routes"); 
app.use("/api/tasks", taskRoutes); 

const userRoutes = require("./routes/user.routes"); 
app.use("/api/users", userRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
