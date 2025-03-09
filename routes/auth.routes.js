const express = require("express");
const router = express.Router();

// Importa la librería validator para una validación más precisa de emails
const validator = require("validator");

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");

// ℹ️ Handles password encryption
const jwt = require("jsonwebtoken");

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("../middleware/jwt.middleware.js");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// POST /auth/signup  - Creates a new user in the database
router.post("/signup", (req, res, next) => {
  const { email, password, handle } = req.body;

  // Check if email or password or handle are provided as empty strings
  if (email === "" || password === "" || handle === "") {
    res.status(400).json({ message: "Provide email, password and handle" });
    return;
  }

  // This regular expression check that the email is of a valid format | Validación básica con regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // Validación precisa con validator
  if (!validator.isEmail(email)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  // This regular expression checks password for special characters and minimum length
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message:
        "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  // Validate handle format
  const handleRegex = /^[a-zA-Z0-9_.]{1,15}$/;
  if (!handleRegex.test(handle)) {
    res.status(400).json({
      message: "Handle can only contain letters, numbers, underscores, dots and must be 1-15 characters long."
    });
    return;
  }

  // Check if a user with the same email or handle already exists
  Promise.all([
    User.findOne({ email }),
    User.findOne({ handle })
  ])
    .then(([userByEmail, userByHandle]) => {
      // If the user with the same email already exists
      if (userByEmail) {
        res.status(400).json({ message: "Email already in use." });
        return;
      }

      // If the user with the same handle already exists
      if (userByHandle) {
        res.status(400).json({ message: "Handle already in use. Please choose another one." });
        return;
      }

      // If email and handle are unique, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create the new user in the database
      return User.create({ 
        email, 
        password: hashedPassword, 
        name: "",  // Use empty string for name
        handle,
        bio: "",
        profilePicture: "",
        location: ""
      });
    })
    .then((createdUser) => {
      // Deconstruct the newly created user object to omit the password
      const { email, handle, _id } = createdUser;

      // Create a new object that doesn't expose the password
      const user = { email, handle, _id };

      // Send a json response containing the user object
      res.status(201).json({ user: user });
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// POST  /auth/login - Verifies email and password and returns a JWT
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password are provided as empty string
  if (email === "" || password === "") {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  // Check the users collection if a user with the same email exists
  User.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        // If the user is not found, send an error response
        res.status(401).json({ message: "User not found." });
        return;
      }

      // Compare the provided password with the one saved in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        // Deconstruct the user object to omit the password
        const { _id, email, handle } = foundUser;

        // Create an object that will be set as the token payload
        const payload = { _id, email, handle };

        // Create a JSON Web Token and sign it
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });

        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and is made available on `req.payload`
  // console.log(`req.payload`, req.payload);

  // Send back the token payload object containing the user data
  res.status(200).json(req.payload);
});

module.exports = router;