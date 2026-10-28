const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    movieCode: {
      type: String,
      unique: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    genre: {
      type: String,
      enum: [
        "Action",
        "Comedy",
        "Drama",
        "Horror",
        "Sci-Fi",
        "Romance",
        "Thriller"
      ],
      required: true
    },

    releaseYear: {
      type: Number,
      required: true,
      min: 1950
    },

    runtime: {
      type: Number,
      required: true,
      min: 30,
      max: 300
    },

    platform: {
      type: String,
      enum: ["Netflix", "Prime Video", "Hotstar", "Theatre", "Other"],
      required: true
    },

    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    status: {
      type: String,
      enum: ["To Watch", "Watching", "Watched"],
      default: "To Watch"
    },

    rating: {
      type: Number,
      min: 1,
      max: 10
    },

    watchedDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);