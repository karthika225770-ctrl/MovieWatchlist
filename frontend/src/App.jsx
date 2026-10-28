import { useEffect, useState } from "react";
import "./index.css";

const API = "http://localhost:5000/api/movies";

const genres = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Sci-Fi",
  "Romance",
  "Thriller"
];

const platforms = [
  "Netflix",
  "Prime Video",
  "Hotstar",
  "Theatre",
  "Other"
];

function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({
    title: "",
    genre: "Action",
    releaseYear: "",
    runtime: "",
    platform: "Netflix",
    priority: 3
  });

  const [statusFilter, setStatusFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchMovies = async () => {
  try {
    const params = new URLSearchParams();

    if (statusFilter) {
      params.append("status", statusFilter);
    }

    if (genreFilter) {
      params.append("genre", genreFilter);
    }

    if (search.trim()) {
      params.append("search", search.trim());
    }

    const response = await fetch(`${API}?${params.toString()}`);
    const result = await response.json();

    if (result.success) {
      setMovies(result.data);
    }
  } catch (err) {
    setError("Unable to fetch movies");
  }
};

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/stats`);
      const result = await response.json();
      setStats(result.data || {});
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchStats();
  }, [statusFilter, genreFilter, search]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      genre: "Action",
      releaseYear: "",
      runtime: "",
      platform: "Netflix",
      priority: 3
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";

      const body = editingId
        ? {
            title: form.title,
            genre: form.genre,
            runtime: Number(form.runtime),
            platform: form.platform,
            priority: Number(form.priority)
          }
        : {
            ...form,
            releaseYear: Number(form.releaseYear),
            runtime: Number(form.runtime),
            priority: Number(form.priority)
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message);
        return;
      }

      resetForm();
      fetchMovies();
      fetchStats();
    } catch (err) {
      setError("Something went wrong");
    }
  };

  const editMovie = (movie) => {
    setEditingId(movie._id);

    setForm({
      title: movie.title,
      genre: movie.genre,
      releaseYear: movie.releaseYear,
      runtime: movie.runtime,
      platform: movie.platform,
      priority: movie.priority
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const deleteMovie = async (movie) => {
    if (movie.status === "Watching") {
      alert("Watching movies cannot be deleted");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete "${movie.title}"?`
    );

    if (!confirmDelete) return;

    const response = await fetch(`${API}/${movie._id}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message);
      return;
    }

    fetchMovies();
    fetchStats();
  };

  const updateStatus = async (movie, newStatus) => {
    let rating;

    if (newStatus === "Watched") {
      rating = prompt("Enter rating from 1 to 10:");

      if (rating === null) return;

      rating = Number(rating);

      if (rating < 1 || rating > 10) {
        alert("Rating must be between 1 and 10");
        return;
      }
    }

    const body = {
      status: newStatus
    };

    if (newStatus === "Watched") {
      body.rating = rating;
    }

    const response = await fetch(
      `${API}/${movie._id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.message);
      return;
    }

    fetchMovies();
    fetchStats();
  };

  const watchNext = async () => {
    const response = await fetch(`${API}/watch-next`);
    const result = await response.json();

    if (!response.ok) {
      alert(result.message);
      return;
    }

    alert(
      `Watch Next:\n\n${result.data.title}\nPriority: ${result.data.priority}\nRuntime: ${result.data.runtime} min`
    );
  };

  return (
    <div className="app">
      <header>
        <h1>🎬 Movie Watchlist</h1>
        <p>Manage your movies and track your watching journey</p>
      </header>

      <section className="stats">
        <div>
          <h3>{stats.totalMovies || 0}</h3>
          <p>Total</p>
        </div>

        <div>
          <h3>{stats.toWatch || 0}</h3>
          <p>To Watch</p>
        </div>

        <div>
          <h3>{stats.watching || 0}</h3>
          <p>Watching</p>
        </div>

        <div>
          <h3>{stats.watched || 0}</h3>
          <p>Watched</p>
        </div>

        <div>
          <h3>{stats.avgRating || 0}</h3>
          <p>Avg Rating</p>
        </div>

        <div>
          <h3>{stats.totalHoursWatched || 0}</h3>
          <p>Hours Watched</p>
        </div>
      </section>

      <section className="form-section">
        <h2>{editingId ? "Edit Movie" : "Add Movie"}</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Movie Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <select
            name="genre"
            value={form.genre}
            onChange={handleChange}
          >
            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>

          {!editingId && (
            <input
              name="releaseYear"
              type="number"
              placeholder="Release Year"
              min="1950"
              max={new Date().getFullYear()}
              value={form.releaseYear}
              onChange={handleChange}
              required
            />
          )}

          <input
            name="runtime"
            type="number"
            placeholder="Runtime (30-300 min)"
            min="30"
            max="300"
            value={form.runtime}
            onChange={handleChange}
            required
          />

          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
          >
            {platforms.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>

          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <option key={number} value={number}>
                Priority {number}
              </option>
            ))}
          </select>

          <button type="submit">
            {editingId ? "Update Movie" : "Add Movie"}
          </button>

          {editingId && (
            <button
              type="button"
              className="cancel"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="controls">
        <input
          placeholder="🔍 Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchMovies();
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="To Watch">To Watch</option>
          <option value="Watching">Watching</option>
          <option value="Watched">Watched</option>
        </select>

        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="">All Genres</option>

          {genres.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>

        <button onClick={() => fetchMovies()}>Search</button>

        <button onClick={watchNext}>
          🎯 Watch Next
        </button>
      </section>

      <section className="movie-grid">
        {movies.length === 0 ? (
          <p>No movies found.</p>
        ) : (
          movies.map((movie) => (
            <div className="movie-card" key={movie._id}>
              <div className="card-top">
                <span className={`status ${movie.status.replace(" ", "-").toLowerCase()}`}>
                  {movie.status}
                </span>

                <span className="priority">
                  ⭐ {movie.priority}
                </span>
              </div>

              <h2>{movie.title}</h2>

              <p>
                <strong>Code:</strong> {movie.movieCode}
              </p>

              <p>
                <strong>Genre:</strong> {movie.genre}
              </p>

              <p>
                <strong>Year:</strong> {movie.releaseYear}
              </p>

              <p>
                <strong>Runtime:</strong> {movie.runtime} min
              </p>

              <p>
                <strong>Platform:</strong> {movie.platform}
              </p>

              {movie.rating && (
                <p>
                  <strong>Rating:</strong> ⭐ {movie.rating}/10
                </p>
              )}

              <div className="actions">
                {movie.status === "To Watch" && (
                  <>
                    <button
                      onClick={() =>
                        updateStatus(movie, "Watching")
                      }
                    >
                      Start Watching
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(movie, "Watched")
                      }
                    >
                      Mark Watched
                    </button>
                  </>
                )}

                {movie.status === "Watching" && (
                  <>
                    <button
                      onClick={() =>
                        updateStatus(movie, "Watched")
                      }
                    >
                      Mark Watched
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(movie, "To Watch")
                      }
                    >
                      Move to To Watch
                    </button>
                  </>
                )}

                {movie.status !== "Watching" && (
                  <>
                    <button
                      onClick={() => editMovie(movie)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete"
                      onClick={() => deleteMovie(movie)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;