const express = require("express");
const Movie = require("../models/Movie");

const router = express.Router();

// GET all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ priority: -1 });

    res.status(200).json({
      success: true,
      message: "Movies fetched successfully",
      data: movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// ADD movie
router.post("/", async (req, res) => {
  try {
    const {
      title,
      genre,
      releaseYear,
      runtime,
      platform,
      priority
    } = req.body;

    const currentYear = new Date().getFullYear();

    // Validation
    if (
      !title ||
      !genre ||
      !releaseYear ||
      !runtime ||
      !platform ||
      !priority
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null
      });
    }

    if (releaseYear < 1950 || releaseYear > currentYear) {
      return res.status(400).json({
        success: false,
        message: `Release year must be between 1950 and ${currentYear}`,
        data: null
      });
    }

    if (runtime < 30 || runtime > 300) {
      return res.status(400).json({
        success: false,
        message: "Runtime must be between 30 and 300 minutes",
        data: null
      });
    }

    if (priority < 1 || priority > 5) {
      return res.status(400).json({
        success: false,
        message: "Priority must be between 1 and 5",
        data: null
      });
    }

    // Duplicate title + release year check
    const existingMovie = await Movie.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
      releaseYear
    });

    if (existingMovie) {
      return res.status(409).json({
        success: false,
        message: "Movie with this title and release year already exists",
        data: null
      });
    }

    // Generate movie code
    const count = await Movie.countDocuments({ releaseYear });
    const sequence = String(count + 1).padStart(3, "0");

    const movieCode = `MV-${releaseYear}-${sequence}`;

    const movie = await Movie.create({
      movieCode,
      title,
      genre,
      releaseYear,
      runtime,
      platform,
      priority,
      status: "To Watch"
    });

    res.status(201).json({
      success: true,
      message: "Movie added successfully",
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// UPDATE movie status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, rating } = req.body;

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
        data: null
      });
    }

    // Watched cannot be changed
    if (movie.status === "Watched") {
      return res.status(400).json({
        success: false,
        message: "Watched movie cannot be changed",
        data: null
      });
    }

    // Check valid status transitions
    const validTransitions = {
      "To Watch": ["Watching", "Watched"],
      "Watching": ["Watched", "To Watch"]
    };

    if (!validTransitions[movie.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${movie.status} to ${status}`,
        data: null
      });
    }

    // Rating required when moving to Watched
    if (status === "Watched") {
      if (rating === undefined || rating < 1 || rating > 10) {
        return res.status(400).json({
          success: false,
          message: "Rating between 1 and 10 is required",
          data: null
        });
      }

      movie.rating = rating;
      movie.watchedDate = new Date();
    }

    movie.status = status;

    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie status updated successfully",
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// EDIT movie
router.put("/:id", async (req, res) => {
  try {
    const { title, genre, runtime, platform, priority } = req.body;

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
        data: null
      });
    }

    movie.title = title ?? movie.title;
    movie.genre = genre ?? movie.genre;
    movie.runtime = runtime ?? movie.runtime;
    movie.platform = platform ?? movie.platform;
    movie.priority = priority ?? movie.priority;

    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// DELETE movie
router.delete("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
        data: null
      });
    }

    if (movie.status === "Watching") {
      return res.status(400).json({
        success: false,
        message: "Watching movie cannot be deleted",
        data: null
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// WATCH NEXT
router.get("/watch-next", async (req, res) => {
  try {
    const movie = await Movie.findOne({
      status: "To Watch"
    }).sort({
      priority: -1,
      runtime: 1
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "No movies available to watch",
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: "Watch next movie fetched successfully",
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// STATS
router.get("/", async (req, res) => {
    // GET movies with filter, search and pagination
router.get("/", async (req, res) => {
  try {
    const {
      status,
      genre,
      search,
      page = 1
    } = req.query;

    const limit = 6;
    const currentPage = Number(page);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (genre) {
      filter.genre = genre;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const totalMovies = await Movie.countDocuments(filter);

    let sortOrder = { priority: -1 };

    // To Watch: highest priority first
    if (status === "To Watch") {
      sortOrder = { priority: -1 };
    }

    const movies = await Movie.find(filter)
      .sort(sortOrder)
      .skip((currentPage - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalMovies / limit);

    res.status(200).json({
      success: true,
      message: "Movies fetched successfully",
      data: movies,
      pagination: {
        currentPage,
        totalPages,
        totalMovies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
  try {
    const movies = await Movie.find();

    const totalMovies = movies.length;

    const toWatch = movies.filter(m => m.status === "To Watch").length;
    const watching = movies.filter(m => m.status === "Watching").length;
    const watched = movies.filter(m => m.status === "Watched").length;

    const watchedMovies = movies.filter(m => m.status === "Watched");

    const totalHoursWatched =
      watchedMovies.reduce((sum, movie) => sum + movie.runtime, 0) / 60;

    const avgRating =
      watchedMovies.length > 0
        ? watchedMovies.reduce((sum, movie) => sum + movie.rating, 0) /
          watchedMovies.length
        : 0;

    const genreCount = {};

    watchedMovies.forEach(movie => {
      genreCount[movie.genre] = (genreCount[movie.genre] || 0) + 1;
    });

    let topGenre = null;

    for (const genre in genreCount) {
      if (!topGenre || genreCount[genre] > genreCount[topGenre]) {
        topGenre = genre;
      }
    }

    res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data: {
        totalMovies,
        toWatch,
        watching,
        watched,
        totalHoursWatched: Number(totalHoursWatched.toFixed(1)),
        avgRating: Number(avgRating.toFixed(1)),
        topGenre
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// STATS
router.get("/stats", async (req, res) => {
  try {
    const movies = await Movie.find();

    const toWatch = movies.filter(m => m.status === "To Watch").length;
    const watching = movies.filter(m => m.status === "Watching").length;
    const watchedMovies = movies.filter(m => m.status === "Watched").length;

    const watched = movies.filter(m => m.status === "Watched");

    const totalHoursWatched =
      watched.reduce((sum, movie) => sum + movie.runtime, 0) / 60;

    const avgRating =
      watched.length > 0
        ? watched.reduce((sum, movie) => sum + movie.rating, 0) / watched.length
        : 0;

    const genreCount = {};

    watched.forEach(movie => {
      genreCount[movie.genre] = (genreCount[movie.genre] || 0) + 1;
    });

    let topGenre = null;

    for (const genre in genreCount) {
      if (!topGenre || genreCount[genre] > genreCount[topGenre]) {
        topGenre = genre;
      }
    }

    res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data: {
        totalMovies: movies.length,
        toWatch,
        watching,
        watched: watchedMovies,
        totalHoursWatched: Number(totalHoursWatched.toFixed(1)),
        avgRating: Number(avgRating.toFixed(1)),
        topGenre
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
module.exports = router;