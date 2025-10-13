import { Router } from 'express';
import { query } from '../../db.js';
import { requireAuth } from './auth.js';

export const favoritesRouter = Router();

favoritesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const rows = await query(
      `SELECT s.school_id, s.name, sec.name AS sector, s.address_text, lvl.name AS level_name,
              s.municipality_id, m.name AS municipality_name, s.lat, s.lng
       FROM favorites f
       JOIN schools s ON s.school_id = f.school_id
       LEFT JOIN municipalities m ON m.municipality_id = s.municipality_id
       LEFT JOIN sectors sec ON sec.sector_id = s.sector_id
       LEFT JOIN levels lvl ON lvl.level_id = s.level_id
       WHERE f.user_id = ?
       ORDER BY s.name`,
      [userId]
    );
    const items = rows.map(r => ({
      school_id: r.school_id,
      name: r.name,
      sector: r.sector,
      address_text: r.address_text,
      level_name: r.level_name,
      municipality_id: r.municipality_id,
      municipality_name: r.municipality_name,
      geom: { type: 'Point', coordinates: [Number(r.lng), Number(r.lat)] }
    }));
    res.json(items);
  } catch (e) { next(e); }
});

favoritesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { school_id } = req.body || {};
    if(!school_id){
      return res.status(400).json({ error: 'school_id required' });
    }
    await query(
      'INSERT IGNORE INTO favorites (user_id, school_id) VALUES (?, ?)',
      [userId, school_id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

favoritesRouter.delete('/:school_id', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { school_id } = req.params;
    await query(
      'DELETE FROM favorites WHERE user_id=? AND school_id=?',
      [userId, school_id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});
