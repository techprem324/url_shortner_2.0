# ⚡ QuickLink 2.0 - URL Shortener & Analytics

A sleek, production-ready Full-Stack URL Shortener with real-time click tracking, custom aliases, QR code generation, and secure user authentication.

🌐 **Local Live URL**: [http://localhost:3001](http://localhost:3001)

---

## ✨ Features

- **Universal URL Shortening**: Supports any valid URL format (`google.com`, `https://...`, complex paths, subdomains).
- **Custom Slugs**: Create personalized short links (e.g., `/my-portfolio`).
- **Duplicate Prevention**: Automatically detects existing links and returns the existing short URL.
- **User Authentication**: Secure Sign Up & Sign In with password hashing (`bcryptjs`) and JWT cookie sessions.
- **Real-Time Analytics**: Tracks total clicks with timestamp, IP, and user-agent logging.
- **Instant QR Codes**: Generate and download high-resolution QR codes for any link.
- **Modern Dashboard**: Dark-mode UI with live search, copy-to-clipboard feedback, and link management.
- **API Rate Limiting**: Protection against abuse and DDoS with `express-rate-limit`.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Authentication** | JWT, bcryptjs, cookie-parser |
| **Frontend** | EJS Templates, Custom CSS, Vanilla JS |
| **Utilities** | QRCode.js, express-rate-limit |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/techprem324/url_shortner_2.0.git
cd url_shortner_2.0
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```ini
PORT=3001
BASE_URL=http://localhost:3001
MONGODB_URI=your_mongodb_connection_string
```

### 3. Start the Server
```bash
npm start
```

Open your browser and visit: **[http://localhost:3001](http://localhost:3001)**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/url` | Shorten a long URL (accepts optional `customAlias`) |
| `GET` | `/:shortId` | Redirect to original URL & increment clicks |
| `GET` | `/url/analytics/:shortId` | Get click analytics for a short link |
| `GET` | `/url/all` | Fetch all shortened URLs |
| `DELETE` | `/url/:shortId` | Delete a shortened link |
| `POST` | `/user/signup` | Register a new user |
| `POST` | `/user/login` | Authenticate user & set session cookie |
| `GET` | `/user/logout` | Clear session cookie |

---

## 📂 Project Structure

```plaintext
├── controllers/       # Business logic (URL shortening, analytics, auth)
├── middlewares/       # JWT session & route protection
├── models/            # Mongoose schemas (URL, User)
├── routes/            # Express route definitions
├── service/           # JWT token helper
├── views/             # EJS templates (Dashboard, Auth, 404)
├── public/            # Static CSS & client JavaScript
├── connect.js         # MongoDB connection manager
├── index.js           # Express app entrypoint
└── package.json       # Project dependencies & scripts
```

---

## 📄 License
This project is open source and available under the [ISC License](LICENSE).
