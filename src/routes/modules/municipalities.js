import { Router } from 'express';
import { query } from '../../db.js';

export const municipalitiesRouter = Router();

municipalitiesRouter.get('/', async (req, res, next) => {
  try {
    const { department_id } = req.query;
    if(!department_id){
      return res.status(400).json({ error: 'department_id required' });
    }
    const rows = await query(
      'SELECT municipality_id, name FROM municipalities WHERE department_id=? ORDER BY name',
      [department_id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

