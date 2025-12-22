# RollCall - Frontend

The frontend is built with **Next.js** to leverage server-side rendering and static site generation where applicable, ensuring a fast and SEO-friendly experience. We use **Tailwind CSS** for a highly customizable and modern design system.

## 🎨 Design Philosophy & Components

The UI is built with a **component-first** approach, prioritizing reusability and state isolation.

### Key Components & Ideology

-   **`Navbar.js`**:
    -   *Ideology*: The "Command Center". It handles global state like User Auth and Dark Mode. It listens to custom events (`auth-change`) to update instantly without page reloads.
-   **`ClassPage` (`app/class/[id]/page.js`)**:
    -   *Ideology*: The "Monolith" of class interaction. It handles complex matrix rendering.
    -   *Features*: Sticky columns for large tables, print-specific CSS (hiding UI buttons), and conditional rendering based on user role (Teacher vs. Student).
-   **`Dashboard` (`app/dashboard/page.js`)**:
    -   *Ideology*: Organized chaos management. It segregates "Active" vs. "Archived" classes to reduce cognitive load.
    -   *Archived Folder*: Uses a collapsible UI pattern to keep the main view clean while keeping history accessible (LIFO sorted).

### Utilities & Helpers

-   **`API` (`utils/api.js`)**: A logical wrapper around Axios. It automatically attaches JWT tokens to every request and handles global error states, ensuring the UI code remains clean of repetitive auth logic.

## Directory Structure

-   `src/app/`: Next.js App Router structure. Each folder is a route.
-   `src/components/`: Reusable atoms and molecules (Buttons, Modals, Navbar).
-   `public/`: Static assets like the Logo and Icons.

## Setup & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000).
