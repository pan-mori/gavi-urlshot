import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Serve admin panel
router.use('/admin', express.static(join(__dirname, '../../public/admin')));

export default router;
