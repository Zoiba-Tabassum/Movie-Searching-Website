const db = require("../db.js");

// Fetch all movies
const getAllMovies = async (req, res) => {
  const query = "CALL displayAllMovies()";

  try {
    const results = await executeQuery(query);
    if (results[0].length === 0) {
      return res.status(404).json({ message: "No movies available." });
    }
    res.status(200).json({
      success: true,
      data: results[0], // Assuming the first index holds the result
    });
  } catch (err) {
    console.error("Error fetching movies:", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle movie search request with optional filters
const handleMovieRequest = async (req, res) => {
  const { searchValue = "", genre, rating, year } = req.query;

  try {
    if (searchValue) {
      // If a search term is provided, fetch movies matching the search term
      const query = `CALL searchSuggestion(?)`;
      const results = await executeQuery(query, [searchValue]);
      const movies = results[0] || [];

      if (movies.length === 0) {
        return res.status(404).json({ message: "No movies found." });
      }

      return res.status(200).json(movies);
    } else {
      // If no search term, fetch movies with filters
      const movies = await getFilteredMovies(searchValue, genre, rating, year);
      return res.status(200).json(movies);
    }
  } catch (error) {
    console.error("Error handling movie request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch movies with optional filters
const getFilteredMovies = async (searchValue, genre, rating, year) => {
  let fetchMoviesQuery = `
    SELECT 
      m.mID, 
      m.mName, 
      m.yearOfRelease, 
      m.rating,
      m.mDescription,
      GROUP_CONCAT(DISTINCT g.gName) AS genres,
      GROUP_CONCAT(DISTINCT a.aName) AS actors,
      GROUP_CONCAT(DISTINCT d.dName) AS directors,
      GROUP_CONCAT(DISTINCT p.pName) AS productionCompanies
    FROM movie m
  `;

  const conditions = [];
  const params = [];

  // Add joins and conditions dynamically
  if (genre) {
    fetchMoviesQuery += ` INNER JOIN movie_genre mg ON m.mID = mg.mID INNER JOIN genre g ON mg.gID = g.gID`;
    conditions.push("g.gName = ?");
    params.push(genre);
  } else {
    fetchMoviesQuery += ` LEFT JOIN movie_genre mg ON m.mID = mg.mID LEFT JOIN genre g ON mg.gID = g.gID`;
  }

  fetchMoviesQuery += `
    LEFT JOIN movie_actor ma ON m.mID = ma.mID
    LEFT JOIN actor a ON ma.aID = a.aID
    LEFT JOIN movie_director md ON m.mID = md.mID
    LEFT JOIN director d ON md.dID = d.dID
    LEFT JOIN movie_prodCoy mp ON m.mID = mp.mID
    LEFT JOIN productionCompany p ON mp.pID = p.pID
  `;

  if (searchValue) {
    conditions.push("m.mName LIKE ?");
    params.push(`%${searchValue}%`);
  }
  if (rating) {
    conditions.push("m.rating >= ?");
    params.push(rating);
  }
  if (year) {
    conditions.push("m.yearOfRelease = ?");
    params.push(year);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  fetchMoviesQuery += `
    ${whereClause}
    GROUP BY m.mID
    ORDER BY m.yearOfRelease DESC;
  `;

  return executeQuery(fetchMoviesQuery, params);
};


//utility function to execute queries
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database query error:", err); // Log detailed error
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  getAllMovies,
  handleMovieRequest,
};
