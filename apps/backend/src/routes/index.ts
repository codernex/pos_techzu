import { Router } from 'express';
import outletRoutes from './outlet.routes';
import menuRoutes from './menu.routes';
import assignmentRoutes from './assignment.routes';
import inventoryRoutes from './inventory.routes';
import saleRoutes from './sale.routes';
import reportRoutes from './report.routes';

const apiRouter = Router();

apiRouter.use('/outlets', outletRoutes);
apiRouter.use('/menu', menuRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/sales', saleRoutes);
apiRouter.use('/reports', reportRoutes);

export default apiRouter;

