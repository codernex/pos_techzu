import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

// Total revenue by outlet
router.get('/revenue-by-outlet', (req, res, next) =>
  reportController.getRevenueByOutlet(req, res, next)
);

// Top 5 selling items (query param ?outletId=... or global)
router.get('/top-items', (req, res, next) =>
  reportController.getTopSellingItems(req, res, next)
);

// Top 5 selling items for an outlet
router.get('/top-items/:outletId', (req, res, next) =>
  reportController.getTopSellingItemsByOutlet(req, res, next)
);

// HQ overview dashboard
router.get('/overview', (req, res, next) =>
  reportController.getGlobalOverview(req, res, next)
);

export default router;

