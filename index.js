const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const movieRoutes = require("./routes/movies");
const path = require("path"); // To serve static files
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cors());
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// API routes for movies
app.use("/api/movies", movieRoutes);

// Catch-all route to handle unknown endpoints
app.use((req, res) => {
  res.status(404).send("404 - Not Found");
});

// Start the server

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${process.env.SERVER_PORT}`);
});
