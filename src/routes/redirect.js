import express from 'express';
import { getUrlByShortCode, logClick } from '../db.js';

const router = express.Router();

// Validate short code format
const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

router.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  // Validate format
  if (!SHORT_CODE_REGEX.test(shortCode)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invalid Short Code</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>❌ Invalid Short Code</h1>
          <p>The short code format is invalid.</p>
        </body>
      </html>
    `);
  }

  try {
    const url = await getUrlByShortCode(shortCode);

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>URL Not Found</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
              h1 { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>404 Not Found</h1>
            <p>This short URL does not exist.</p>
            <p><code>${shortCode}</code></p>
          </body>
        </html>
      `);
    }

    // Log the click asynchronously
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;

    logClick(url.id, userAgent, referrer).catch(err => {
      console.error('Failed to log click:', err);
    });

    // Redirect to target URL
    res.redirect(302, url.target_url);

  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Server Error</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>500 Server Error</h1>
          <p>Something went wrong. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

export default router;
