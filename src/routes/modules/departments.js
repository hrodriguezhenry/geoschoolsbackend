import { Router } from 'express';
import { query } from '../../db.js';

export const departmentsRouter = Router();

departmentsRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query(
      'SELECT department_id, name FROM departments ORDER BY name'
    );
    res.json(rows);
  } catch (e) { next(e); }
});

