require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Connect to database and start the server
async function startServer() {
  try {

    // Ensure MongoDB connection string exists in environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file.");
    }

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Start listening for incoming requests
    app.listen(PORT, () => {
      console.log(`OneSphere API is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error("Could not start OneSphere:", error.message);
    process.exit(1);
  }
}

startServer();
