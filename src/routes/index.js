import { Router } from 'express';
import { departmentsRouter } from './modules/departments.js';
import { municipalitiesRouter } from './modules/municipalities.js';
import { schoolsRouter } from './modules/schools.js';
import { favoritesRouter } from './modules/favorites.js';
import { authRouter } from './modules/auth.js';
import { reviewsRouter } from './modules/reviews.js';
import { catalogsRouter } from './modules/catalogs.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/municipalities', municipalitiesRouter);
apiRouter.use('/schools', schoolsRouter);
apiRouter.use('/favorites', favoritesRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/catalogs', catalogsRouter);
