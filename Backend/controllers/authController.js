const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.AUTH0_CLIENT_ID);



// Signup controller
exports.signup = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  if (!firstname || !lastname || !username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: "You already have an account with this email or username",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res
      .status(201)
      .json({ message: "User registered successfully", token, userId: newUser._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Login controller
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, userId: user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update Profile Controller ✅ (Final Version)
exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { username, profilePicture } = req.body; // Use destructuring

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update username if provided
    if (username) {
      user.username = username;
    }

    // Update profile picture if provided
    if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profilePicture: user.profilePicture,
      username: user.username,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    // Handle duplicate username error
    if (error.code === 11000 && error.keyPattern.username) {
      return res.status(400).json({ message: "Username already exists" });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// Fetch User Profile
exports.fetchUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    res.status(500).json({ message: "Failed to load user information" });
  }
};

exports.auth0Signup = async (req, res) => {
  const { firstname, lastname, username, email, profilePicture } = req.body;

  console.log("Received User Data:", req.body); // Log the incoming data

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        firstname: firstname || "Unknown",
        lastname: lastname || "",
        username: username || email.split("@")[0], // Fallback to email prefix if username is missing
        email,
        profilePicture: profilePicture || "",
        password: "googleAuth", // Dummy password for social signup
      });

      await user.save();
      console.log("New User Created:", user); // Log the newly created user
    } else {
      console.log("Existing User Found:", user); // Log the existing user
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created with Google Auth0",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Auth0 Signup Error:", err);

    // Handle duplicate username error
    if (err.code === 11000 && err.keyPattern.username) {
      return res.status(400).json({ message: "Username already exists" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};


// controllers/authController.js

exports.auth0Login = async (req, res) => {
  const { email, name, picture } = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find or create the user
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        firstname: name?.split(" ")[0] || "Unknown",
        lastname: name?.split(" ")[1] || "",
        email,
        profilePicture: picture || "",
        username: email.split("@")[0], // Fallback to email prefix
        password: "auth0_password", // Dummy password for social login
      });

      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login Successful via Google",
      token,
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("Auth0 Login Error:", error);

    // Handle duplicate username error
    if (error.code === 11000 && error.keyPattern.username) {
      return res.status(400).json({ message: "Username already exists" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update profile visibility
exports.updateProfileVisibility = async (req, res) => {
  try {
      const { userId } = req.params;
      const { profileVisibility } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { profileVisibility },
          { new: true }
      );

      if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(updatedUser);
  } catch (error) {
      console.error("Error updating profile visibility:", error);
      res.status(500).json({ message: "Failed to update profile visibility" });
  }
};