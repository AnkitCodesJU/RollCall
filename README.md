# RollCall - Attendance App

RollCall is a modern, full-stack attendance management application built with the MERN stack (MongoDB, Express, React/Next.js, Node.js). It streamlines the process of tracking attendance, managing classes, and analyzing student performance with a premium, user-centric interface.

## 🚀 Live Demo

[**https://roll-call-mu.vercel.app/**](https://roll-call-mu.vercel.app/)

## ✨ Key Features

This application is packed with features designed for both Teachers and Students.

### 📚 Class Management
-   **Create & Manage Classes**: Teachers can easily create courses with unique join codes.
-   **Archive System**: Keep your dashboard clean by archiving finished classes. Archived classes are stored in a collapsible "Archived Folder" sorted LIFO (Last-In, First-Out) and can be unarchived at any time.
-   **Join Requests**: Control access to your class. Teachers approve or decline student join requests.

### 📊 Attendance Tracking & Matrix
-   **Dynamic Matrix View**: A spreadsheet-like view of all students and attendance dates.
-   **Customizable Columns**: Add custom columns for dates or specific activities.
-   **Private Columns**: Mark columns as "Private" to hide them from students (perfect for grading or internal notes).
-   **One-Click Status Updates**: Toggle attendance status (Present, Absent, Late, Excused) with a single click.

### 📤 Data Export & Reporting
-   **Download CSV**: Export class data to CSV. Choose to include or exclude private columns.
-   **Print View**: A clean, printer-friendly version of the class register with the official logo.

### 🔔 Real-Time Communication
-   **Notifications**: Comprehensive notification system (in-app alerts) to keep everyone in the loop.
    -   **For Students**: Immediate alerts when they are removed from a class or their join request is approved/denied.
    -   **For Teachers**: Notifications when a student voluntarily leaves a class.
-   **Student Actions**: Students can leave a class if needed, triggering a notification to the teacher.

### 📝 Remarks & Customization
-   **Remarks Column**: Teachers can add custom columns to the matrix to record specific remarks, notes, or grades for each student.
-   **Private Columns**: Toggle visibility of any column (including remarks) to keep sensitive info private from students.

### 🌓 UI/UX
-   **Dark/Light Mode**: Fully responsive theme switching.
-   **Responsive Design**: Works seamlessly on desktop, tablet, and mobile.

## Technology Stack

-   **Frontend**: Next.js 14, Tailwind CSS, Heroicons
-   **Backend**: Node.js, Express.js, JWT Authentication
-   **Database**: MongoDB (Mongoose)

## Project Structure

-   `backend/`: Node.js server, API routes, controllers, and models.
-   `frontend/`: Next.js application, React components, and pages.

## Getting Started

1.  **Backend Setup**: See [backend/README.md](./backend/README.md) for server configuration and API details.
2.  **Frontend Setup**: See [frontend/README.md](./frontend/README.md) for UI setup and component philosophy.
