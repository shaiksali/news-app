# 📰 GNews App — Full Stack News App

A complete, production-ready news application built with:
- **Backend**: Node.js + Express (secures your API key)
- **Frontend**: React Native + Expo (JavaScript)
- **API**: [GNews.io](https://gnews.io) v4

---

## 🗂 Project Structure

```
news-app/
├── backend/               ← Express API proxy server
│   ├── server.js          ← Main server
│   ├── .env.example       ← Copy to .env and add your key
│   └── package.json
│
└── frontend/              ← React Native Expo app
    ├── App.js             ← Entry point + Navigation
    ├── app.json           ← Expo config
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.js          ← News feed with categories
    │   │   ├── SearchScreen.js        ← Search articles
    │   │   └── ArticleDetailScreen.js ← Full article view
    │   ├── components/
    │   │   ├── NewsCard.js            ← Article card (default + featured)
    │   │   ├── CategoryPill.js        ← Horizontal category filter
    │   │   ├── SkeletonCard.js        ← Loading skeleton
    │   │   └── ErrorState.js          ← Error UI
    │   ├── hooks/
    │   │   └── useNews.js             ← useTopHeadlines + useSearch hooks
    │   └── utils/
    │       ├── api.js                 ← API service functions
    │       └── config.js              ← Colors, categories, API URL
    └── package.json
```

---

## 🚀 Setup & Run

### Step 1 — Backend Setup

```bash
cd news-app/backend

# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env and replace YOUR_GNEWS_API_KEY_HERE with your key from https://gnews.io/dashboard

# Start server (development)
npm run dev

# OR start server (production)
npm start
```

Backend runs on: **http://localhost:3000**

Test it:
```bash
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/top-headlines?category=technology"
curl "http://localhost:3000/api/search?q=AI"
```

---

### Step 2 — Frontend Setup

```bash
cd news-app/frontend

# Install dependencies
npm install

# Configure API URL (important!)
# Open src/utils/config.js and update API_BASE_URL:
# - iOS Simulator: http://localhost:3000/api
# - Android Emulator: http://10.0.2.2:3000/api  ← Change this!
# - Physical Device: http://YOUR_COMPUTER_IP:3000/api

# Start Expo
npx expo start
```

Then press:
- `i` → iOS Simulator
- `a` → Android Emulator
- Scan QR code with Expo Go app for physical device

---

## 📡 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/categories` | List all available categories |
| GET | `/api/top-headlines` | Fetch top headlines |
| GET | `/api/search` | Search articles by keyword |

### Top Headlines Params
| Param | Default | Options |
|-------|---------|---------|
| `category` | `general` | general, world, nation, business, technology, entertainment, sports, science, health |
| `lang` | `en` | en, ar, zh, fr, de, es, it, ja, ... |
| `country` | `us` | us, gb, in, au, ca, ... |
| `max` | `10` | 1–10 |
| `page` | `1` | Any integer |

### Search Params
| Param | Default | Description |
|-------|---------|-------------|
| `q` | required | Search keywords |
| `lang` | `en` | Language |
| `max` | `10` | 1–10 |
| `page` | `1` | Page number |
| `sortby` | `publishedAt` | `publishedAt` or `relevance` |
| `from` | — | ISO date e.g. `2024-01-01T00:00:00Z` |
| `to` | — | ISO date |

---

## ✨ App Features

- 📰 **Home Feed** — Top headlines with featured card + list
- 🗂 **Category Filter** — 9 categories: General, World, Nation, Business, Tech, Entertainment, Sports, Science, Health
- 🔍 **Search** — Keyword search with trending topics
- 📄 **Article Detail** — Full article view with share + open in browser
- 🔄 **Pull to Refresh** — Refresh news feed
- 📜 **Infinite Scroll** — Load more articles on scroll
- 💀 **Skeleton Loading** — Smooth loading states
- ❌ **Error Handling** — User-friendly error screens
- 🌙 **Dark Theme** — Beautiful dark UI throughout

---

## 🔐 Security Notes

- Your GNews API key is stored only in the backend `.env` file
- The frontend never directly calls GNews — it calls your backend proxy
- Rate limiting is enabled on the backend (100 req / 15 min per IP)
- Never commit your `.env` file (it's in `.gitignore`)

---

## 📲 Physical Device Setup

To test on a real phone:

1. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. In `frontend/src/utils/config.js`, set:
   ```js
   export const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
   ```
3. Make sure your phone and computer are on the same WiFi network
4. Open Expo Go app → scan the QR code from `npx expo start`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo SDK 51 |
| Navigation | React Navigation v6 (Stack) |
| Icons | @expo/vector-icons (Ionicons) |
| Backend | Node.js + Express 4 |
| HTTP (backend) | Axios |
| HTTP (frontend) | Native `fetch` |
| Security | Helmet + CORS + Rate Limiting |
| News API | GNews.io v4 |
