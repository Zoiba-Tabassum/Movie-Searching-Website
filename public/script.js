// Call the function to fetch all movies
document.addEventListener("DOMContentLoaded", () => {
  fetchAllMovies(); // Fetch all movies on page load
});

let ratingChartInstance; // Store the Chart instance

const fetchAllMovies = async () => {
  try {
    // Make the GET request to fetch all movies
    const response = await fetch("/api/movies");

    if (response.ok) {
      const result = await response.json(); // Parse the JSON response
      const movies = result.data; // Access the `data` property

      if (Array.isArray(movies)) {
        // Sort only if `movies` is an array
        movies.sort((a, b) => b.rating - a.rating);

        // Select top 5 highest-rated movies
        const topMovies = movies.slice(0, 5);

        // Extract movie titles and ratings for the bar chart
        const movieTitles = topMovies.map((movie) => movie.mName);
        const movieRatings = topMovies.map((movie) => movie.rating);

        // Call the displayBarChart function to show the chart
        displayBarChart(movieTitles, movieRatings);

        // Call the displayMovies function to show the top 5 movies
        displayMovies(movies); // Display only top 5 highest-rated movies
      } else {
        console.error("Invalid data format received:", movies);
        showError("Error loading movies. Please try again later.");
      }
    } else {
      console.error("Error fetching movies:", response.statusText);
      showError("Error loading movies. Please try again later.");
    }
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    showError("Error loading movies. Please try again later.");
  }
};

// Function to fetch movies from the database
const fetchMovies = async (
  searchValue = "",
  genre = "",
  rating = "",
  year = ""
) => {
  try {
    // Construct query parameters only if values are provided
    const params = new URLSearchParams();
    if (searchValue) params.append("searchValue", searchValue);
    if (genre) params.append("genre", genre);
    if (rating) params.append("rating", rating);
    if (year) params.append("year", year);

    // Make the GET request using fetch
    const response = await fetch(`/api/movies/search?${params.toString()}`);

    if (response.ok) {
      const movies = await response.json();

      if (movies.length === 0) {
        showError("No movies found matching your criteria.");
        return;
      }
      // Sort movies by rating in descending order
      movies.sort((a, b) => b.rating - a.rating);

      // Select top 5 highest-rated movies
      const topMovies = movies.slice(0, 5);

      // Extract movie titles and ratings
      const movieTitles = topMovies.map((movie) => movie.mName);
      const movieRatings = topMovies.map((movie) => movie.rating);

      // Display the bar chart
      displayBarChart(movieTitles, movieRatings);

      displayMovies(movies); // Display the fetched movies
    } else {
      console.error("Error fetching movies:", response.statusText);
      showError("Error loading movies. Please try again later.");
    }
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    showError("Error loading movies. Please try again later.");
  }
};

// Function to display movies in the DOM
function displayMovies(movies) {
  const container = document.getElementById("movie-container");
  container.innerHTML = ""; // Clear previous results

  if (!movies || movies.length === 0) {
    container.innerHTML = "<p>No movies found.</p>";
    return;
  }
  // Loop through the movies and create HTML elements
  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    // Handle null or undefined values for optional fields
    const genres = movie.genres || "Not available";
    const actors = movie.actors || "Not available";
    const directors = movie.directors || "Not available";
    const productionCompanies = movie.productionCompanies || "Not available";

    const ratingPercentage = (movie.rating / 10) * 100; // Convert rating to percentage

    card.innerHTML = `
      <h2>${movie.mName}</h2>
      <p><strong>Year:</strong> ${movie.yearOfRelease}</p>
      <p><strong>Genres:</strong> ${genres}</p>
      <p><strong>Rating:</strong> ${movie.rating}</p>
      <div class="rating-bar-container">
        <div class="rating-bar" style="width: ${ratingPercentage}%;"></div>
      </div>
      <p><strong>Actors:</strong> ${actors}</p>
      <p><strong>Directors:</strong> ${directors}</p>
      <p><strong>Production Companies:</strong> ${productionCompanies}</p>
      <p><strong>Plot:</strong> ${movie.mDescription}</p>
    `;
    container.appendChild(card);
  });
}

function displayBarChart(titles, ratings) {
  if (titles.length === 0 || ratings.length === 0) {
    showError("No movie data available for the chart.");
    return;
  }
  const ctx = document.getElementById("ratingChart").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (ratingChartInstance) {
    ratingChartInstance.destroy();
  }

  // Create a new Chart instance and store it
  ratingChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: titles,
      datasets: [
        {
          label: "Movie Ratings",
          data: ratings,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderColor: "rgba(0, 0, 0, 1)",
          borderWidth: 1,
          barThickness: 40,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function to show error message
function showError(message) {
  const container = document.getElementById("movie-container");
  container.innerHTML = `<p>${message}</p>`;
}

// Event listener to Handle Search Button Click
document.getElementById("search-button").addEventListener("click", () => {
  const searchValue = document.getElementById("search-bar").value.trim();
  const genre = document.getElementById("genre-filter").value;
  const rating = document.getElementById("rating-filter").value; // Assuming a rating dropdown exists
  const year = document.getElementById("year-filter").value; // Assuming a year dropdown exists

  // Check if searchValue is empty
  if (!searchValue && !genre && !rating && !year) {
    showError("Please enter a search term or select filters.");
    return;
  }

  // Clear any existing error message
  document.getElementById("movie-container").innerHTML = "";
  // Fetch movies based on all selected filters
  fetchMovies(searchValue, genre, rating, year);
});
