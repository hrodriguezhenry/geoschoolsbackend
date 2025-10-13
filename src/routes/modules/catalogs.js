import { Router } from 'express';
import { query } from '../../db.js';

export const catalogsRouter = Router();

catalogsRouter.get('/sectors', async (_req, res, next) => {
  try { res.json(await query('SELECT sector_id, name FROM sectors ORDER BY name')); } catch(e){ next(e); }
});
catalogsRouter.get('/levels', async (_req, res, next) => {
  try { res.json(await query('SELECT level_id, name FROM levels ORDER BY name')); } catch(e){ next(e); }
});
catalogsRouter.get('/areas', async (_req, res, next) => {
  try { res.json(await query('SELECT area_id, name FROM areas ORDER BY name')); } catch(e){ next(e); }
});
catalogsRouter.get('/modalities', async (_req, res, next) => {
  try { res.json(await query('SELECT modality_id, name FROM modalities ORDER BY name')); } catch(e){ next(e); }
});
catalogsRouter.get('/schedules', async (_req, res, next) => {
  try { res.json(await query('SELECT schedule_id, name FROM schedules ORDER BY name')); } catch(e){ next(e); }
});
catalogsRouter.get('/plans', async (_req, res, next) => {
  try { res.json(await query('SELECT plan_id, name FROM plans ORDER BY name')); } catch(e){ next(e); }
});

