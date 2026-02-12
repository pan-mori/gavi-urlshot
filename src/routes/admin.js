import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Serve admin panel with index fallback
router.use('/admin', express.static(join(__dirname, '../../public/admin'), {
  index: 'index.html'
}));

// Serve QR visualization page with index fallback
router.use('/qr', express.static(join(__dirname, '../../public/qr'), {
  index: 'index.html'
}));

export default router;
