# Movie Watchlist Manager

MERN Stack coding test project.

## Structure

- frontend - React application
- backend - Express.js / Node.js API
- MongoDB Atlas - database

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Run backend

```bash
cd backend
npm install
npm start
```

MongoDB Atlas connection will be configured in `backend/.env`.
## API Endpoints

- GET /api/movies
- POST /api/movies
- PUT /api/movies/:id
- PATCH /api/movies/:id/status
- DELETE /api/movies/:id
- GET /api/movies/watch-next
- GET /api/movies/stats


## Project

Movie Watchlist Manager is a MERN application for adding,
editing, tracking and managing movies with status,
priority, ratings and watch statistics.
