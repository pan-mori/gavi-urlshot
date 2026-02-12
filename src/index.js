import express from 'express';
import { initDb } from './db.js';
import redirectRouter from './routes/redirect.js';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize database
await initDb();
console.log('Database initialized');

// Routes - ORDER MATTERS!
// Admin panel first (highest priority)
app.use(adminRouter);

// API routes
app.use('/api', apiRouter);

// Redirect routes (catch-all, must be last)
app.use(redirectRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Not Found</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
          }
          h1 { color: #e74c3c; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>404 Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/admin">Go to Admin Panel</a></p>
      </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});
