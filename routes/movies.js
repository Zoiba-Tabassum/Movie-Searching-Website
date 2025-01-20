const express = require("express");
const router = express.Router();
const movieController = require("../Controllers/movieController");

// Route for fetching all movies
router.get("/", movieController.getAllMovies);

// Route for handling movie search with filters
router.get("/search", movieController.handleMovieRequest);

module.exports = router;
