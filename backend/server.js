const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const movieRoutes = require("./routes/movieRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/movies", movieRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Movie Watchlist API is working",
    data: null
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
    });
