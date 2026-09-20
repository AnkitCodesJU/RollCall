# RollCall Architecture Overview

This document provides a high-level architecture view of the RollCall application and the main interaction flows between the frontend, backend, and data layer.

## 1) System Architecture

```mermaid
flowchart LR
    User["Student / Teacher / Admin<br/>Browser"]

    subgraph Frontend["Frontend - Next.js"]
        UI["Next.js UI<br/>Pages, Components, Forms"]
        State["Client State + API Calls<br/>Axios / Fetch"]
    end

    subgraph Backend["Backend - Node.js + Express"]
        API["REST API Routes"]
        Auth["Auth Middleware + JWT Validation"]
        Ctrl["Controllers"]
    end

    subgraph Services["Business Logic"]
        Users["User & Profile APIs"]
        Classes["Class Management<br/>Join Requests<br/>Matrix Updates"]
        Notify["Notifications<br/>Announcements"]
    end

    DB[(MongoDB Atlas / Local MongoDB)]
    JWT[(JWT Tokens)]

    User --> UI
    UI --> State
    State --> API

    API --> Auth
    Auth --> Ctrl
    Ctrl --> Users
    Ctrl --> Classes
    Ctrl --> Notify

    Users --> DB
    Classes --> DB
    Notify --> DB

    Auth --> JWT
    API -->|Bearer Token| JWT
```

### Architectural Notes

- Frontend: Next.js-based React application for the UI, role-based dashboards, attendance matrix, class management, and notifications.
- Backend: Express.js API server responsible for REST endpoints, JWT validation, authorization, and business logic.
- Data Layer: MongoDB stores users, classes, class membership, attendance records, notifications, and related documents.
- Security: Protected endpoints verify JWT tokens via middleware and apply role checks for teacher/admin access.

## 2) Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Next.js Frontend
    participant Backend as Express API
    participant DB as MongoDB
    participant JWT as JWT Service

    User->>Frontend: Register / Login
    Frontend->>Backend: POST /api/auth/register or /api/auth/login
    Backend->>DB: Validate credentials and fetch user data
    DB-->>Backend: User record
    Backend->>JWT: Generate access + refresh tokens
    JWT-->>Backend: Signed tokens
    Backend-->>Frontend: Auth response + token payload
    Frontend->>Frontend: Store token in secure client storage

    Frontend->>Backend: Protected API request with Authorization: Bearer <token>
    Backend->>JWT: Verify token signature and decode payload
    JWT-->>Backend: User claims
    Backend->>DB: Fetch authorization-related data if needed
    DB-->>Backend: Permission context
    Backend-->>Frontend: Authorized response
```

## 3) Class Creation and Attendance Management Flow

```mermaid
flowchart TD
    A[Teacher opens dashboard] --> B[Create class with name + join code]
    B --> C[POST /api/classes]
    C --> D[Backend validates teacher role]
    D --> E[Class document created in MongoDB]
    E --> F[Teacher can invite students via join code]
    F --> G[Student submits join request]
    G --> H[POST /api/classes/join]
    H --> I[Teacher approves or denies request]
    I --> J[Class membership updated]
    J --> K[Teacher adds date columns / attendance marks]
    K --> L[Update matrix records]
    L --> M[Students view attendance summary]
```

## 4) Student Join Request and Notification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Frontend as Next.js Frontend
    participant API as Express API
    participant DB as MongoDB
    participant Teacher as Teacher Dashboard
    participant Notify as Notification Service

    Student->>Frontend: Enter class code
    Frontend->>API: POST /api/classes/join
    API->>DB: Create join request for student + class
    DB-->>API: Request saved
    API-->>Frontend: Request submitted

    API->>Teacher: Notify teacher of new join request
    Teacher->>API: Approve / decline request
    API->>DB: Update membership / status
    DB-->>API: Membership result
    API->>Notify: Create notification record
    Notify->>DB: Save notification
    DB-->>Frontend: Updated notifications
    Frontend-->>Student: Access granted or denied
```

## 5) Attendance Matrix Update Flow

```mermaid
flowchart LR
    T[Teacher] --> U[Open class matrix]
    U --> V[Select student + date column]
    V --> W[PUT /api/classes/:id/cells]
    W --> X[Backend validates permissions]
    X --> Y[Update ClassRecord / attendance values]
    Y --> Z[MongoDB stores cell data]
    Z --> AA[Frontend refreshes matrix view]
    AA --> AB[Student sees updated attendance status]
```

## 6) High-Level End-to-End View

```mermaid
flowchart TB
    Browser[Browser / Web App]
    Next[Next.js Frontend]
    API[Express REST API]
    Auth[JWT Auth Middleware]
    Controllers["Controllers<br/>User / Class / Notification"]
    Mongo[(MongoDB)]
    Users[Users]
    Classes[Classes + Attendance Matrix]
    Notifications[Notifications]

    Browser --> Next
    Next --> API
    API --> Auth
    Auth --> Controllers

    Controllers --> Users
    Controllers --> Classes
    Controllers --> Notifications

    Users --> Mongo
    Classes --> Mongo
    Notifications --> Mongo
```

## Summary

RollCall follows a typical MERN-style architecture:

- Next.js frontend for user interaction and dashboards.
- Express API for secure business logic and route handling.
- MongoDB for persistent storage of users, classes, attendance records, and notifications.
- JWT-based authentication for session validation and protected access.
- Role-based restrictions to separate student, teacher, and admin responsibilities.

This architecture supports the app’s core workflows: authentication, class management, attendance tracking, approvals, notifications, and reporting.
