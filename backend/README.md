# RollCall - Backend

This directory contains the backend server for the RollCall application, built with Node.js and Express.

## Directory Structure

-   `src/config/`: Configuration files (e.g., database connection).
-   `src/controllers/`: Logic for handling API requests.
-   `src/middlewares/`: Express middlewares (e.g., authentication).
-   `src/models/`: Mongoose schemas for MongoDB.
-   `src/routes/`: API route definitions.
-   `server.js`: Entry point for the server.

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the `backend` directory with your configuration (e.g., `MONGO_URI`, `PORT`).

3.  **Start Server**:
    ```bash
    npm start
    ```
    The server will typically run on `http://localhost:5000` (or your configured port).

## API Overview

-   `/api/auth`: Authentication routes (login, register).
-   `/api/users`: User management routes.
-   `/api/attendance`: Attendance tracking routes.
