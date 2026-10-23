const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Secure HTTP headers
app.use(helmet());

// Enable CORS for frontend client
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(cookieParser());

// Parse JSON request bodies (limit payload size to 10kb)
app.use(express.json({ limit: '10kb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OneSphere API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('API error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : 'Something went wrong on the server.',
  });
});

module.exports = app;