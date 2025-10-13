import { Router } from 'express';
import { query } from '../../db.js';
import { requireAuth } from './auth.js';

export const reviewsRouter = Router();

reviewsRouter.post('/', requireAuth, async (req, res, next) => {
  try{
    const { school_id, rating, comment, cost } = req.body || {};
    if(!school_id || !rating) return res.status(400).json({ error: 'school_id and rating required' });
    const user = await query('SELECT first_name, last_name FROM users WHERE user_id=?', [req.user.user_id]);
    const full = `${user[0]?.first_name || ''} ${user[0]?.last_name || ''}`.trim() || 'Usuario';
    // Enforce one review per user per school
    const exists = await query('SELECT review_id FROM reviews WHERE user_id=? AND school_id=?', [req.user.user_id, school_id]);
    if(exists.length){ return res.status(409).json({ error: 'Already reviewed' }); }
    const r = await query('INSERT INTO reviews (school_id, user_id, user_full_name, rating, comment, cost) VALUES (?,?,?,?,?,?)', [school_id, req.user.user_id, full, Number(rating), comment || null, cost || null]);
    res.json({ ok: true, review_id: r.insertId });
  }catch(e){ next(e); }
});

// Return current user's review for a school
reviewsRouter.get('/mine', requireAuth, async (req, res, next) => {
  try{
    const { school_id } = req.query;
    if(!school_id) return res.status(400).json({ error: 'school_id required' });
    const rows = await query('SELECT review_id, school_id, rating, comment, cost, user_full_name FROM reviews WHERE user_id=? AND school_id=?', [req.user.user_id, school_id]);
    res.json(rows[0] || null);
  }catch(e){ next(e); }
});

// Update a review (must be owner)
reviewsRouter.patch('/:review_id', requireAuth, async (req, res, next) => {
  try{
    const { review_id } = req.params;
    const { rating, comment, cost } = req.body || {};
    const rows = await query('SELECT user_id FROM reviews WHERE review_id=?', [review_id]);
    const r = rows[0];
    if(!r) return res.status(404).json({ error: 'Not found' });
    if(r.user_id !== req.user.user_id) return res.status(403).json({ error: 'Forbidden' });
    await query('UPDATE reviews SET rating=?, comment=?, cost=? WHERE review_id=?', [Number(rating), comment || null, cost || null, review_id]);
    res.json({ ok: true });
  }catch(e){ next(e); }
});
