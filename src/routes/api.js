import express from 'express';
import { getAllUrls, createUrl, updateUrl, deleteUrl, getStats } from '../db.js';

const router = express.Router();

// Validation
const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
const URL_REGEX = /^https?:\/\/.+/;

// GET /api/urls - Get all URLs with click counts
router.get('/urls', async (req, res) => {
  try {
    const urls = await getAllUrls();
    res.json(urls);
  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// POST /api/urls - Create new URL mapping
router.post('/urls', async (req, res) => {
  const { short_code, target_url, description } = req.body;

  // Validation
  if (!short_code || !target_url) {
    return res.status(400).json({ error: 'short_code and target_url are required' });
  }

  if (!SHORT_CODE_REGEX.test(short_code)) {
    return res.status(400).json({
      error: 'Invalid short_code format. Use 3-20 alphanumeric characters, hyphens, or underscores.'
    });
  }

  if (!URL_REGEX.test(target_url)) {
    return res.status(400).json({
      error: 'Invalid target_url. Must start with http:// or https://'
    });
  }

  try {
    const url = await createUrl(short_code, target_url, description || null);
    res.status(201).json(url);
  } catch (error) {
    console.error('Create URL error:', error);

    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'This short_code is already in use' });
    }

    res.status(500).json({ error: 'Failed to create URL mapping' });
  }
});

// PUT /api/urls/:id - Update URL mapping
router.put('/urls/:id', async (req, res) => {
  const { id } = req.params;
  const { target_url, description } = req.body;

  if (!target_url) {
    return res.status(400).json({ error: 'target_url is required' });
  }

  if (!URL_REGEX.test(target_url)) {
    return res.status(400).json({
      error: 'Invalid target_url. Must start with http:// or https://'
    });
  }

  try {
    const result = await updateUrl(parseInt(id), target_url, description || null);

    if (!result) {
      return res.status(404).json({ error: 'URL mapping not found' });
    }

    res.json({ success: true, id: parseInt(id) });
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Failed to update URL mapping' });
  }
});

// DELETE /api/urls/:id - Delete URL mapping
router.delete('/urls/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteUrl(parseInt(id));

    if (!result) {
      return res.status(404).json({ error: 'URL mapping not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Failed to delete URL mapping' });
  }
});

// GET /api/urls/:id/stats - Get detailed statistics
router.get('/urls/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    const stats = await getStats(parseInt(id));
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
