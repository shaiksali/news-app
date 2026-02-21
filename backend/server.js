require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ─── In-Memory User Storage (for development only) ──────────────────────────────
const users = new Map(); // In production, use a real database

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting - protect your API key from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Authentication Middleware ────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];
const VALID_LANGS = ['en', 'ar', 'zh', 'nl', 'fr', 'de', 'el', 'he', 'hi', 'it', 'ja', 'ml', 'mr', 'no', 'pt', 'ro', 'ru', 'es', 'sv', 'ta', 'te', 'uk'];

function validateApiKey() {
  if (!GNEWS_API_KEY || GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY_HERE') {
    throw new Error('GNEWS_API_KEY is not configured. Please set it in your .env file.');
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GNews Backend is running',
    apiKeyConfigured: !!(GNEWS_API_KEY && GNEWS_API_KEY !== 'YOUR_GNEWS_API_KEY_HERE'),
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { fullName, email, password }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      fullName,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.set(email, user);

    // Generate token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, fullName, email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (token invalidation on client-side)
 */
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  try {
    const token = jwt.sign({ id: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Token refreshed', token });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

/**
 * PUT /api/auth/update-profile
 * Update user profile
 */
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = users.get(req.user.email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) {
      user.fullName = fullName;
    }

    res.json({
      message: 'Profile updated successfully',
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = users.get(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If email exists, reset link has been sent' });
    }

    // In production, send email with reset token
    res.json({ message: 'If email exists, reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: 'Forgot password request failed', error: error.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // In production, verify token and find user
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});


/**
 * GET /api/top-headlines
 * Fetch top headlines by category
 * Query params: category, lang, country, max, page
 */
app.get('/api/top-headlines', async (req, res) => {
  try {
    validateApiKey();

    const {
      category = 'general',
      lang = 'en',
      country = 'us',
      max = 10,
      page = 1,
    } = req.query;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Valid options: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    const response = await axios.get(`${GNEWS_BASE_URL}/top-headlines`, {
      params: {
        category,
        lang,
        country,
        max: Math.min(parseInt(max), 10), // GNews free tier max is 10
        page: parseInt(page),
        apikey: GNEWS_API_KEY,
      },
    });

    const { totalArticles, articles } = response.data;

    res.json({
      success: true,
      totalArticles,
      articles: articles.map(normalizeArticle),
      category,
      page: parseInt(page),
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/search
 * Search for articles by keyword
 * Query params: q, lang, country, max, page, from, to, in, sortby
 */
app.get('/api/search', async (req, res) => {
  try {
    validateApiKey();

    const {
      q,
      lang = 'en',
      country,
      max = 10,
      page = 1,
      from,
      to,
      in: searchIn = 'title,description',
      sortby = 'publishedAt',
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const params = {
      q: q.trim(),
      lang,
      max: Math.min(parseInt(max), 10),
      page: parseInt(page),
      in: searchIn,
      sortby,
      apikey: GNEWS_API_KEY,
    };

    if (country) params.country = country;
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axios.get(`${GNEWS_BASE_URL}/search`, { params });
    const { totalArticles, articles } = response.data;

    res.json({
      success: true,
      totalArticles,
      articles: articles.map(normalizeArticle),
      query: q,
      page: parseInt(page),
    });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * GET /api/categories
 * Returns available categories list
 */
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    categories: VALID_CATEGORIES.map((cat) => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeArticle(article) {
  return {
    title: article.title || '',
    description: article.description || '',
    content: article.content || '',
    url: article.url || '',
    image: article.image || null,
    publishedAt: article.publishedAt || null,
    source: {
      name: article.source?.name || 'Unknown',
      url: article.source?.url || '',
    },
  };
}

function handleError(error, res) {
  console.error('API Error:', error.message);

  if (error.message.includes('GNEWS_API_KEY')) {
    return res.status(500).json({ error: error.message });
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your GNews API key.' });
    }
    if (status === 403) {
      return res.status(403).json({ error: 'Daily request limit reached. Try again tomorrow.' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
    }

    return res.status(status).json({ error: data?.errors?.join(', ') || 'GNews API error.' });
  }

  res.status(500).json({ error: 'Internal server error. Please try again.' });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 GNews Backend running on http://localhost:${PORT}`);
  console.log(`📰 API Key configured: ${!!(GNEWS_API_KEY && GNEWS_API_KEY !== 'YOUR_GNEWS_API_KEY_HERE')}`);
  console.log('\nAvailable endpoints:');
  console.log('\n📰 News Endpoints:');
  console.log(`  GET /api/health`);
  console.log(`  GET /api/categories`);
  console.log(`  GET /api/top-headlines?category=general&lang=en&max=10`);
  console.log(`  GET /api/search?q=technology&lang=en&max=10`);
  console.log('\n🔐 Auth Endpoints:');
  console.log(`  POST /api/auth/register - Register new user`);
  console.log(`  POST /api/auth/login - Login user`);
  console.log(`  POST /api/auth/logout - Logout user (requires token)`);
  console.log(`  POST /api/auth/refresh - Refresh token (requires token)`);
  console.log(`  GET /api/auth/me - Get current user (requires token)`);
  console.log(`  PUT /api/auth/update-profile - Update profile (requires token)`);
  console.log(`  POST /api/auth/forgot-password - Request password reset`);
  console.log(`  POST /api/auth/reset-password - Reset password\n`);
});

module.exports = app;
