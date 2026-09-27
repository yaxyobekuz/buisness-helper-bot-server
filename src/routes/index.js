import { Router } from 'express';

import { mongoose } from '../config/database.js';
import * as auth from '../controllers/auth.controller.js';
import * as applications from '../controllers/application.controller.js';
import * as entrepreneurs from '../controllers/entrepreneur.controller.js';
import * as stats from '../controllers/stats.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    database: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
});

router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);
router.patch('/auth/profile', requireAuth, auth.updateProfile);

router.get('/stats/overview', requireAuth, stats.overview);

router.get('/applications', requireAuth, applications.list);
router.get('/applications/:id', requireAuth, applications.getById);
router.patch('/applications/:id', requireAuth, applications.updateStatus);

router.get('/entrepreneurs', requireAuth, entrepreneurs.list);
router.get('/entrepreneurs/:id', requireAuth, entrepreneurs.getById);

export default router;
