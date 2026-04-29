<div align="center">

# WorkSync (An Enterprise Work Management System)  

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
<br/>
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

</div>

> <p align="justify">WorkSync is a robust, real-time enterprise work management platform designed to streamline project tracking, task delegation, and cross-team collaboration. Featuring a dynamic drag-and-drop Kanban board, live socket-based notifications, and interactive, data-driven dashboards, it empowers teams to seamlessly synchronize workflows, monitor progress, and drive productivity.</p>

## Table of Contents

- [Live Demo & Links](#live-demo--links)
- [UI & Design Highlights](#ui--design-highlights)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [UI Walkthrough & Screenshots](#ui-walkthrough--screenshots)
- [User Roles & Permissions](#user-roles--permissions)
- [Getting Started (Local Setup)](#getting-started-local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing Strategy & Coverage](#testing-strategy--coverage)
- [Deployment Guide](#deployment-guide)
- [Author](#author)

## Live Demo & Links

Experience the live application and its backend infrastructure:

* **Frontend (Live App):** [https://worksyncplatform.netlify.app](https://worksyncplatform.netlify.app)
* **Backend API Base URL:** [https://workmanagementplatform-production.up.railway.app](https://workmanagementplatform-production.up.railway.app)

### Test Account Credentials
To explore the platform without registering, feel free to use the following test credentials. The Manager account is recommended as it provides access to the project creation and analytics features.

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Manager** | `manager@worksync.com` | `WorksyncMng123` |
| **Employee** | `employee@worksync.com` | `WorksyncEmp123` |

> ⚠️ Please do not change the passwords of the test accounts so others can continue to evaluate the project.


## UI & Design Highlights

The user interface of WorkSync is designed to be **premium, modern, and highly intuitive**, utilizing industry-standard UX principles:

* **Responsive Layout:** Adapts perfectly to mobile, tablet, and desktop screens with a collapsible sidebar and mobile-friendly navigation.
* **Sleek Dark Mode:** Full native support for a sleek, eye-friendly Dark Theme using Tailwind's `dark:` classes, stored persistently.
* **Micro-interactions & Animations:** Smooth hover states, focus rings, and seamless drag-and-drop animations (using `@hello-pangea/dnd`) make the app feel alive and responsive.
* **Modern Component Aesthetics:** Uses rounded corners, soft shadows, glassmorphism elements, and `lucide-react` for crisp, professional iconography.
* **Real-Time Feedback:** Contextual, non-intrusive `react-toastify` alerts keep the user informed during form submissions and data updates.

## Key Features

* **Real-Time Kanban Board:** Drag and drop tasks across columns (`Pending`, `In Progress`, `Completed`) with instant Socket.io synchronization.
* **Live Notifications:** Receive real-time push notifications for task assignments and status changes without refreshing the page.
* **Interactive Dashboard Analytics:** Visualize project progress, daily completions, and team productivity using beautifully integrated `recharts`.
* **Role-Based Access Control (RBAC):** Distinct views, security permissions, and capabilities mapped explicitly to `Admin`, `Manager`, and `Employee` roles.
* **Project & Task Management:** Easily dispatch entire projects, assign specific tasks, set priorities, and track deadlines.
* **Robust Test Coverage:** The React frontend is backed by a comprehensive Vitest testing suite, ensuring maximum stability, reliability, and regression prevention!

## Tech Stack

| Category | Technologies Used | Primary Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite | Fast, component-driven UI development and optimized bundling. |
| **State Management**| Redux Toolkit | Centralized global state handling (Auth, user sessions). |
| **Routing & Forms** | React Router v6, React Hook Form, Yup | Secure client-side routing and schema-based form validation. |
| **Styling & Assets** | Tailwind CSS, Lucide React | Utility-first responsive design and crisp, modern iconography. |
| **Interactive UI** | `@hello-pangea/dnd`, Recharts, React Toastify| Kanban drag-and-drop mechanics, analytics, and toast alerts. |
| **Backend Server** | Node.js, Express.js | Scalable RESTful API and backend business logic execution. |
| **Database** | Firebase Firestore | NoSQL document-based storage for tasks, projects, and users. |
| **Real-Time Engine**| Socket.io | Bidirectional WebSockets for live notifications and board sync. |
| **Testing Suite** | Vitest, React Testing Library | Comprehensive unit and component testing to ensure stability. |
| **Deployment** | Netlify, Railway | CI/CD cloud hosting for the frontend and backend respectively. |

## Architecture

WorkSync utilizes a decoupled client-server architecture, ensuring scalability and a distinct separation of concerns. 

* **The Frontend (Client):** Manages local UI state and user interactions. Redux Toolkit handles global state (like user sessions), while Axios manages asynchronous REST requests.
* **The Backend (API):** Acts as the secure middleman. Express routes handle standard CRUD operations, applying Role-Based Access Control (RBAC) middleware before touching the database.
* **The Real-Time Layer:** Socket.io runs alongside the Express server, maintaining persistent WebSocket connections for live Kanban board updates and push notifications without HTTP polling overhead.

### 1. Frontend Architecture (React + Vite)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              React 18 UI (Vite)                             │
│                                                                             │
│ ┌─────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌───────────────┐ │
│ │Dashboard│ │Kanban Board│ │ Projects UI │ │Settings UI │ │Admin Dashboard│ │
│ └────┬────┘ └──────┬─────┘ └──────┬──────┘ └─────┬──────┘ └───────┬───────┘ │
└──────│─────────────│──────────────│──────────────│────────────────│─────────┘
       │             │              │              │                │
       ▼             ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              State Management                               │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │Redux Toolkit (Auth) │  │ Context API (Theme) │  │React Hook Form (UI) │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘  │
└─────────────│────────────────────────│────────────────────────│─────────────┘
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Network & Communication                           │
│                                                                             │
│          ┌─────────────────────────┐   ┌─────────────────────────┐          │
│          │ Axios (REST API Client) │   │  Socket.io (Real-Time)  │          │
│          └─────────────────────────┘   └─────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture (Node.js + Express + Firebase)
```
┌─────────────────────────────────────────────────────────────┐
│                   Node.js + Express Server                  │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  API Routes  ├───► Auth / RBAC  ├───►   Controllers   │  │
│  │ (Tasks, Auth)│   │  Middleware  │   │ (Business Logic)│  │
│  └──────┬───────┘   └──────────────┘   └───────┬─────────┘  │
└─────────│──────────────────────────────────────│────────────┘
          │                                      │
          ▼                                      ▼
┌──────────────────┐               ┌──────────────────────────┐
│ Socket.io Server │◄──────────────┤ Firebase Admin SDK       │
│ (WebSocket Port) │ (Emit Event)  │ (Database Communication) │
└─────────┬────────┘               └─────────────┬────────────┘
          │                                      │
          ▼                                      ▼
┌──────────────────┐               ┌──────────────────────────┐
│     Clients      │               │   Firebase Firestore     │
│ (Real-Time UI)   │               │    (NoSQL Database)      │
└──────────────────┘               └──────────────────────────┘
```

### 3. Core Data Flow Examples

To understand how the decoupled systems interact, here are the primary data flows covering real-time updates, analytical queries, and admin privileges:

**A. Real-Time Kanban Sync (Drag & Drop)**
```
[Client: Admin/Manager]      [Node.js Backend]              [Database & Sockets]
         │                            │                                 │
         │ 1. Drag & Drop Task        │                                 │
         ├───────────────────────────►│                                 │
         │   (PATCH /api/tasks/id)    │ 2. Verify Role (Admin/Manager)  │
         │                            ├────────────┐                    │
         │                            │◄───────────┘                    │
         │                            │ 3. Update Document & Logs       │
         │                            ├────────────────────────────────►│
         │ 4. Success Response (200)  │                                 │
         │◄───────────────────────────┤                                 │
         │                            │ 5. Trigger Socket Event         │
         │                            ├────────────────────────────────►│
                                                                        │
                                                                        │ 6. Emit 'new_notification'
                                    [Client: Employee]◄─────────────────┤
                                                        (WebSocket)
```

**B. Admin Privilege Action (User Removal & Role Updates)**
```
[Client: Admin]              [Node.js Backend]                 [Database]
         │                            │                             │
         │ 1. Click 'Remove User'     │                             │
         ├───────────────────────────►│                             │
         │  (DELETE /api/users/id)    │ 2. Enforce 'Admin' Policy   │
         │                            ├────────────┐                │
         │                            │◄───────────┘                │
         │                            │ 3. Delete from Firestore    │
         │                            ├────────────────────────────►│
         │ 4. Success Response (200)  │                             │
         │◄───────────────────────────┤                             │
```

**C. Dashboard Aggregation & Settings Updates**
```
[Client: Any User]           [Node.js Backend]                 [Database]
         │                            │                             │
         │ 1. Load Dashboard/Settings │                             │
         ├───────────────────────────►│                             │
         │ (GET /api/system/stats)    │ 2. Fetch Projects, Tasks,   │
         │                            │    and System Activity      │
         │                            ├────────────────────────────►│
         │                            │                             │
         │                            │ 3. Return Aggregated Data   │
         │                            │◄────────────────────────────┤
         │                            │ 4. Compute Chart Statistics │
         │                            ├────────────┐                │
         │                            │◄───────────┘                │
         │ 5. Render Recharts Data    │                             │
         │◄───────────────────────────┤                             │
```

## UI Walkthrough & Screenshots

### 1. Interactive Analytics Dashboard
The central hub for all users. Managers can dispatch new projects from here, while everyone can view Recharts-powered interactive graphs for Project Progress and Task Completion, alongside an activity feed.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 173633.png" alt="WorkSync Dashboard" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 173642.png" alt="WorkSync Dashboard" width="800"/>
</p>

### 2. Project Center
A dedicated workspace for high-level project management. Managers can create new projects, and both Managers and Admins can edit and securely delete entire projects (which cascades to all associated tasks), while Employees can view the projects they contribute to.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 173951.png" alt="Project Center" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174011.png" alt="Project Center" width="800"/>
</p>

### 3. Real-Time Kanban Board
A seamless drag-and-drop workspace powered by `@hello-pangea/dnd`. Tasks are visually categorized, and moving a card triggers live Socket.io push notifications to the relevant team members.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174316.png" alt="Kanban Board" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174340.png" alt="Kanban Board" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174416.png" alt="Kanban Board" width="800"/>
</p>

### 4. Role-Based User Management
Exclusive to Admins, this view allows for the tracking of employee status (Online/Offline) in real-time, role assignments, and system-wide user administration.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174654.png" alt="User Management" width="800"/>
</p>

### 5. Settings, Dark Mode & Notifications
Users can toggle the persistent Dark Mode, update personal details, and receive live, toast-based feedback and Socket.io push notifications instantly.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174846.png" alt="Settings and Notifications" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 174946.png" alt="Settings and Notifications" width="800"/>
</p>

## User Roles & Permissions

WorkSync implements strict Role-Based Access Control (RBAC) at both the UI routing level and the Express API middleware level to ensure data privacy and hierarchical workflow management.

| Feature & Capability | Admin | Manager | Employee |
| :--- | :--- | :--- | :--- |
| **Access Dashboard Analytics** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create Projects** | ❌ No | ✅ Yes | ❌ No |
| **Create & Dispatch Tasks** | ✅ Yes | ✅ Yes | ❌ No |
| **View Kanban Board Tasks** | ✅ All system tasks | ✅ Created or assigned to them | ✅ Assigned to them only |
| **Move Tasks (Drag & Drop)** | ✅ Any task | ✅ Created or assigned to them | ✅ Assigned to them only |
| **Edit Task Details** | ✅ Any task | ✅ Created or assigned to them | ✅ Assigned to them only |
| **Delete Tasks** | ✅ Any task | ✅ Only tasks they created | ❌ No |
| **Access User Management Directory** | ✅ Yes | ❌ No | ❌ No |
| **Receive Live Notifications** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Update Personal Settings** | ✅ Yes | ✅ Yes | ✅ Yes |


## Getting Started (Local Setup)

### Prerequisites
---
Before you begin, ensure you have the following installed on your machine:
* **Node.js** (v18.0.0 or higher recommended)
* **Git** (for cloning the repository)
* A **Firebase** Account (to set up your own Firestore database and generate the Admin SDK credentials)

### Installation Steps
---

**1. Clone the repository**
```bash
git clone https://github.com/RajeshJena14/WorkManagementPlatform.git
cd WorkManagementPlatform
```

**2. Setup the Backend**<br>
Open your terminal and navigate to the backend directory to install its specific dependencies:
```bash
cd backend
npm install
```

**3. Setup the Frontend**<br>
Open a new, separate terminal window (keep the backend terminal open) and navigate to the frontend directory:
```bash
cd enterpriseapp
npm install
```

### Running the Application Locally
---
Once your environment variables are configured (see the next section), you will need to run both the client and the server simultaneously.

**1. Start the Backend Server:**<br>
In your backend terminal, run:
```bash
npm run dev
```
*(The server will typically start on http://localhost:5000)*

*Expected Terminal Output:*
```
> backend@1.0.0 dev
> nodemon src/server.js

[nodemon] starting `node src/server.js`
Server is running on http://localhost:5000
Firebase Admin connected successfully.
WebSocket Server is ready.
```

**2. Start the Frontend Development Server:**<br>
In your frontend terminal, run:
```bash
npm run dev
```
*(The Vite React app will typically start on http://localhost:5173. Open this link in your browser!)*

*Expected Terminal Output:*
```
> frontend@0.0.0 dev
> vite

  VITE v5.x.x  ready in 345 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Environment Variables

To run this project locally, you will need to configure environment variables for the backend server. 

*(Note: The frontend does not require a `.env` file, as the Axios instance and Socket.io connections are pre-configured in the source code to communicate with the appropriate API endpoints).*

**⚠️ CRITICAL:** Never commit your backend `.env` file to GitHub. Ensure it is listed in your `backend/.gitignore`.

### Backend Variables
1. Create a `.env` file in the root of the **`backend/`** directory. 

2. Add the following variables to the `.env` file:

| Variable Name | Description | Example Value (Do not use real secrets here) |
| :--- | :--- | :--- |
| `PORT` | The port the Express server runs on | `5000` |
| `JWT_SECRET` | Secret key for signing Auth tokens | `your_super_secret_jwt_string_here` |
| `FIREBASE_SERVICE_ACCOUNT` | The entire Firebase Admin SDK JSON configuration as a single stringified object. | *(See formatting details below)* |

#### Formatting your Firebase Service Account
You will need to generate a new Private Key from your Firebase Console (**Project Settings > Service Accounts**) and download the JSON file. 

To use it in your `.env` file, you must minify the entire JSON object into a **single string** and wrap it in single quotes (`''`). Here is the exact structure of the JSON object *(In your `.env` file, wrap it in single quotes (`''`) and replace the placeholder values with your actual generated secret values)*:

```json
FIREBASE_SERVICE_ACCOUNT=
    {
        "type": "service_account",
        "project_id": "your-firebase-project-id",
        "private_key_id": "your-private-key-id",
        "private_key": "-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@your-firebase-project-id.iam.gserviceaccount.com",
        "client_id": "your-client-id",
        "auth_uri": "[https://accounts.google.com/o/oauth2/auth](https://accounts.google.com/o/oauth2/auth)",
        "token_uri": "[https://oauth2.googleapis.com/token](https://oauth2.googleapis.com/token)",
        "auth_provider_x509_cert_url": "[https://www.googleapis.com/oauth2/v1/certs](https://www.googleapis.com/oauth2/v1/certs)",
        "client_x509_cert_url": "[https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40your-firebase-project-id.iam.gserviceaccount.com](https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40your-firebase-project-id.iam.gserviceaccount.com)",
        "universe_domain": "googleapis.com"
    }
```

## Project Structure

WorkSync is organized into a clean, decoupled folder structure, separating the React frontend from the Node.js backend.

```text
WorkManagementPlatform/
├── backend/                        # Node.js / Express Server
│   ├── src/
│   │   ├── controllers/            # Business logic (e.g., taskController.js)
│   │   ├── middleware/             # Role-Based Access Control & Auth verification
│   │   ├── routes/                 # Express API endpoint definitions
│   │   ├── config/                 # Firebase Admin initialization & Socket setup
│   │   └── server.js               # Main entry point & WebSocket server
│   ├── .env                        # Environment variables (Ignored in Git)
│   ├── .gitignore
│   └── package.json                # Server dependencies & scripts
│
└── enterpriseapp/                  # React 18 / Vite Client
    ├── public/                     # Static public assets
    ├── src/
    │   ├── assets/                 # Local images and icons
    │   ├── components/             # Reusable UI (e.g., Sidebar, Modal)
    │   ├── context/                # React Context (e.g., ThemeContext)
    │   ├── features/               # Complex logic and forms (e.g., TaskForm)
    │   ├── pages/                  # Route views (e.g., Dashboard.jsx, KanbanBoard.jsx)
    │   ├── services/               # Axios instance configuration (api.js)
    │   ├── store/                  # Redux Toolkit slices and global state
    │   ├── App.jsx                 # Main application router
    │   └── main.jsx                # React DOM entry point
    ├── .gitignore
    ├── package.json                # Client dependencies & scripts
    ├── tailwind.config.js          # Tailwind CSS design system rules
    └── vite.config.js              # Vite bundler configuration
```

## Testing Strategy & Coverage

The WorkSync frontend is backed by a robust, comprehensive testing suite powered by **Vitest** and **React Testing Library (RTL)**. 

Our testing strategy focuses heavily on component reliability, global state integration, and strict routing security (ensuring Role-Based Access Control is enforced at the UI level).

### Running the Tests

To interact with the test suite locally, open your frontend terminal and use the following commands:

* **Run all tests:** `npm run test`
* **Open the Vitest UI Dashboard:** `npm run test:ui`
* **Generate the Coverage Report:** `npm run coverage`

### Test Coverage Summary

We maintain an exceptionally high standard of code reliability, with **132 passing tests** and zero failures. Below are the exact coverage metrics generated by the Istanbul/v8 engine:

| Metric | Coverage Percentage |
| :--- | :--- |
| **Statements** | `93.49%` |
| **Lines** | `93.82%` |
| **Functions** | `92.44%` |
| **Branches** | `89.53%` |

### Testing Visualized

**Vitest UI Dashboard (132 Passing Tests)**<br>
Validating critical application flows, including unauthorized user redirects, Admin-only route protection, and component rendering.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 134747.png" alt="Vitest UI Dashboard" width="800"/>
</p>

**Coverage Report Breakdown**<br>
Detailed coverage analysis showing near-perfect coverage across core components, routing contexts, and feature forms.
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 134918.png" alt="Test Coverage Report" width="800"/>
</p>
<p align="center">
  <img src="./screenshots/Screenshot 2026-04-29 134852.png" alt="Test Coverage Report" width="800"/>
</p>

## Deployment Guide

WorkSync is designed to be easily deployed to modern cloud hosting platforms. The frontend is optimized for **Netlify**, while the Node.js backend is configured for **Railway**.

### Backend Deployment (Railway)

Railway is perfect for hosting our Express API and Socket.io server.

1. **Create a Railway Project:** Log in to [Railway](https://railway.app/) and click **New Project** > **Deploy from GitHub repo**.
2. **Select Repository:** Choose your `WorkManagementPlatform` repository.
3. **Configure the Root Directory:** Because this is a monorepo, you must tell Railway where the backend lives. Go to the service **Settings** > **Build**, and change the **Root Directory** to `/backend`.
4. **Environment Variables:** Go to the **Variables** tab and enter your production credentials:
   * `JWT_SECRET`
   * `FIREBASE_SERVICE_ACCOUNT` (Paste the minified string as explained in the Environment Variables section)
   * *(Note: Railway automatically provides the `PORT` variable, so you do not need to set it).*
5. **Deploy & Get URL:** Railway will automatically build and deploy the server. Once finished, go to the **Settings** > **Networking** tab and click **Generate Domain**. Save this URL for the frontend configuration!

### Frontend Deployment (Netlify)

Netlify is ideal for our Vite + React Single Page Application (SPA).

1. **Update API Endpoints:** Before deploying, ensure your `api.js` Axios instance and Socket.io client connections are pointing to your newly generated **Railway Production URL** instead of `localhost`. Push these changes to GitHub.
2. **Create a Netlify Site:** Log in to [Netlify](https://www.netlify.com/) and click **Add new site** > **Import an existing project** from GitHub.
3. **Configure Build Settings:** Set the following configurations carefully so Netlify builds the correct folder:
   * **Base directory:** `enterpriseapp`
   * **Build command:** `npm run build`
   * **Publish directory:** `enterpriseapp/dist`
4. **Handling React Router (CRITICAL):** Because this is a React SPA using React Router, you must prevent 404 errors when refreshing pages. Ensure you have a `_redirects` file inside your `enterpriseapp/public/` folder with the following exact content before pushing to GitHub:
   ```text
   /* /index.html   200
   ```
5. **Deploy:** Click **Deploy site**. Netlify will build the Vite app and provide you with a live URL (e.g., https://worksyncplatform.netlify.app).

## Author

**Rajesh Kumar Jena**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RajeshJena14)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jenarajeshkumar)