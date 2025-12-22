# RollCall - Backend

The backend of RollCall is designed with a focus on **modularity**, **security**, and **scalability**. It serves as the data powerhouse, handling authentication, class logic, and real-time updates.

## 🧠 Core Ideology

The backend is structured around the **Model-View-Controller (MVC)** pattern (adapted for API use as Model-Route-Controller) to ensure separation of concerns.

### Controllers & Logic
We believe in keeping business logic isolated within controllers:

-   **`authController.js`**: Handles user lifecycle (register, login) and JWT generation. It ensures only authenticated users access protected routes.
-   **`classController.js`**: The heart of the application. It manages specialized logic like:
    -   **Matrix Generation**: Dynamically constructs the attendance spreadsheet data structure.
    -   **Archiving Logic**: Toggles the `isArchived` flag, allowing for efficient filtering on the frontend without data loss.
    -   **Student Enrollment**: Handles complex flows like join requests, approvals, and removals, ensuring data consistency across User and Class models.
-   **`notificationController.js`**: Manages the notification system, allowing asynchronous communication between teachers and students (e.g., alert on removal).

### Security First
-   **Middleware (`authMiddleware.js`)**: All protected routes are guarded. We verify JWT tokens on every request and check specific roles (Teacher vs. Student) for sensitive actions like deleting columns or archiving classes.

## Directory Structure

-   `src/config/`: Database connection (MongoDB) and environment setup.
-   `src/models/`: Mongoose schemas defining data consistency (User, Class, Notification).
-   `src/routes/`: Express routers that map HTTP endpoints to controller functions.
-   `src/middlewares/`: Custom logic for request processing (Auth, Error Handling).

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    Create `.env` with: `MONGO_URI`, `JWT_SECRET`, `PORT`.
3.  **Start Server**:
    ```bash
    npm run dev  # Runs with nodemon for hot-reloading
    ```
