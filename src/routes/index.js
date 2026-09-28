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
// "export" `:id` dan oldin turishi shart, aks holda id deb qabul qilinadi.
router.get('/applications/export', requireAuth, applications.exportXlsx);
router.get('/applications/:id', requireAuth, applications.getById);
router.patch('/applications/:id', requireAuth, applications.updateStatus);
router.delete('/applications/:id', requireAuth, applications.softDelete);
router.post('/applications/:id/restore', requireAuth, applications.restore);

router.get('/entrepreneurs', requireAuth, entrepreneurs.list);
router.get('/entrepreneurs/export', requireAuth, entrepreneurs.exportXlsx);
router.get('/entrepreneurs/:id', requireAuth, entrepreneurs.getById);
router.delete('/entrepreneurs/:id', requireAuth, entrepreneurs.softDelete);
router.post('/entrepreneurs/:id/restore', requireAuth, entrepreneurs.restore);

export default router;
