# ⚡ QuickLink - Enterprise URL Shortener & Real-Time Analytics

<div align="center">

[![Render Status](https://img.shields.io/badge/Deployment-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://url-shortner-1-0.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-ISC-6366F1?style=for-the-badge)](LICENSE)

<br/>

**A next-generation, high-performance URL shortener featuring real-time click tracking, custom aliases, camera-scannable QR codes with instant PNG downloads, and secure user authentication.**

[🌐 Explore Live Site](https://url-shortner-1-0.onrender.com) • [📖 Documentation](#-api-endpoints) • [🚀 Quick Start](#-quick-start)

</div>

---

## 🌟 Key Highlights

- **⚡ Lightning-Fast Shortening**: Instant short URL generation with universal validation (supports root domains, HTTPS, query strings, and subdomains).
- **🏷️ Custom Slug Aliases**: Personalize your shortened links with memorable custom aliases (e.g. `quicklink.io/my-portfolio`).
- **📷 Interactive QR Engine**:
  - Scan directly with any phone camera to visit the shortened link instantly.
  - Download crisp, high-resolution PNG QR codes (600x600) with 1 click.
  - Dedicated server-side streaming endpoints (`/url/qr/:shortId` and `/url/qr/download/:shortId`).
- **🎨 Midnight Obsidian & Aurora Design System**:
  - Deep obsidian dark palette with glowing electric violet (`#6366F1`) and neon cyan (`#06B6D4`) ambient lighting.
  - Ultra-smooth glassmorphism (`backdrop-filter`), reactive hover effects, and tactile feedback.
  - Refined typography powered by *Plus Jakarta Sans*, *Outfit*, and *JetBrains Mono*.
- **📊 Real-Time Click Analytics & MongoDB Atlas**:
  - Redirects logged with millisecond timestamps, IP addresses, and User-Agent telemetry.
  - Automatic duplicate prevention that reuses existing slugs while tracking lifetime engagement.
- **🛡️ Enterprise Security**:
  - Built-in DDoS and spam mitigation via `express-rate-limit`.
  - BCrypt password hashing and secure HTTP-only JWT cookie authentication.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Architecture** | Node.js (v20+), Express.js (v5), Cookie-Parser |
| **Database & Persistence** | MongoDB Atlas Cloud, Mongoose ODM |
| **Authentication & Security** | JSON Web Tokens (JWT), BCryptJS, Express-Rate-Limit |
| **Frontend UI & Templates** | EJS Server-Rendered Views, Vanilla CSS3 (Custom Design System), ES6+ JavaScript |
| **QR Code Engine** | Node QRCode (Server stream & PNG download) + QRCode Canvas (Client-side) |
| **Cloud Deployment** | Render (Auto-deploy on GitHub push) |

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/techprem324/url_shortner_2.0.git
cd url_shortner_2.0
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```ini
PORT=3001
BASE_URL=http://localhost:3001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Run Development Server
```bash
npm start
```

Visit the application in your browser: **`http://localhost:3001`**

---

## 🔌 API Endpoints

### URL Shortener & Analytics

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/url` | Shorten a destination URL (supports optional `customAlias`) |
| `GET` | `/:shortId` | Redirect to destination & record click analytics |
| `GET` | `/url/all` | Fetch links for the dashboard (supports `?my=true` filter) |
| `GET` | `/url/analytics/:shortId` | Get detailed click history and telemetry for a link |
| `GET` | `/url/qr/:shortId` | Stream live QR code image (PNG) |
| `GET` | `/url/qr/download/:shortId` | Trigger direct download of high-resolution QR PNG |
| `DELETE` | `/url/:shortId` | Delete a shortened link |

### User Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/user/signup` | Register a new user account |
| `POST` | `/user/login` | Authenticate user and issue secure JWT session cookie |
| `GET` | `/user/logout` | Terminate session and clear JWT cookie |

---

## 📂 Project Architecture

```plaintext
├── controllers/
│   ├── url.js             # Shortening algorithm, analytics, QR streaming & download
│   └── user.js            # User registration, authentication & sessions
├── middlewares/
│   └── auth.js            # JWT verification and route protection
├── models/
│   ├── url.js             # URL schema (shortId, originalUrl, clicks, history)
│   └── user.js            # User schema (name, email, hashed password)
├── routes/
│   ├── staticRouter.js    # Dashboard, Login, and Signup view routes
│   ├── url.js             # REST API routes for URL and QR operations
│   └── user.js            # Auth routes (signup, login, logout)
├── service/
│   └── auth.js            # JWT signing and validation services
├── views/
│   ├── home.ejs           # Main dashboard with shortener card, metrics & table
│   ├── auth.ejs           # Sign in & Sign up tabbed interface
│   └── 404.ejs            # Cyberpunk 404 error page
├── public/
│   ├── css/
│   │   └── style.css      # Custom design system with aurora lighting effects
│   └── js/
│       └── main.js        # Client interactions, clipboard, search, and QR modal
├── connect.js             # MongoDB Atlas connection manager with retry logic
├── index.js               # Application entrypoint & reverse-proxy configuration
└── package.json           # Dependencies and project metadata
```

---

## 🌐 Production Deployment

The project is configured for continuous deployment on **Render**:
1. Every push to the `main` branch automatically triggers a fresh production build and zero-downtime deployment.
2. Reverse proxy headers are automatically respected (`trust proxy` enabled).
3. Access the live production app here: **[https://url-shortner-1-0.onrender.com](https://url-shortner-1-0.onrender.com)**

---

## 📄 License
This project is open-source under the [ISC License](LICENSE).
