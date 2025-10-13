import { Router } from 'express';
import { query } from '../../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from '../../config.js';

export const authRouter = Router();

function getTokenFromReq(req){
  const auth = req.headers?.authorization;
  if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7);
  }
  return req.cookies?.sid || null;
}

function setSession(res, user){
  const token = jwt.sign({ uid: user.user_id, email: user.email }, config.auth.jwtSecret, { expiresIn: `${config.auth.jwtDays}d` });
  res.cookie('sid', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: config.auth.jwtDays * 24 * 60 * 60 * 1000
  });
  return token;
}

export async function requireAuth(req, res, next){
  try{
    const token = getTokenFromReq(req);
    if(!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, config.auth.jwtSecret);
    req.user = { user_id: payload.uid, email: payload.email };
    next();
  }catch(e){
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function tryGetUser(req){
  try{
    const token = getTokenFromReq(req); if(!token) return null;
    const payload = jwt.verify(token, config.auth.jwtSecret);
    return { user_id: payload.uid, email: payload.email };
  }catch{ return null; }
}

authRouter.get('/me', async (req, res) => {
  const user = tryGetUser(req);
  if(!user) return res.json(null);
  const rows = await query('SELECT user_id, first_name, last_name, email FROM users WHERE user_id=?', [user.user_id]);
  res.json(rows[0] || null);
});

authRouter.post('/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body || {};
  if(!first_name || !last_name || !email || !password){
    return res.status(400).json({ error: 'Missing fields' });
  }
  const exists = await query('SELECT user_id FROM users WHERE email=?', [email]);
  if(exists.length){ return res.status(409).json({ error: 'Email already registered' }); }
  const hash = await bcrypt.hash(password, 10);
  const r = await query('INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?,?,?,?)', [first_name, last_name, email, hash]);
  const user = { user_id: r.insertId, email, first_name, last_name };
  const token = setSession(res, user);
  res.json({ user, token });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  const rows = await query('SELECT user_id, email, first_name, last_name, password_hash FROM users WHERE email=?', [email]);
  const user = rows[0];
  if(!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = setSession(res, user);
  res.json({ user: { user_id: user.user_id, email: user.email, first_name: user.first_name, last_name: user.last_name }, token });
});

authRouter.post('/logout', async (_req, res) => {
  res.clearCookie('sid');
  res.json({ ok: true });
});

authRouter.post('/forgot', async (req, res) => {
  const { email } = req.body || {};
  if(!email) return res.status(400).json({ error: 'Email required' });
  const rows = await query('SELECT user_id, email FROM users WHERE email=?', [email]);
  const user = rows[0];
  if(!user){ return res.json({ ok: true }); }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000*60*30); // 30m
  await query('INSERT INTO password_resets (token, user_id, email, expires_at) VALUES (?,?,?,?)', [token, user.user_id, user.email, expires]);

  const link = `${req.headers.origin || ''}/#/login?reset_token=${token}`;
  try{
    if(config.smtp.host){
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
      });
      await transporter.sendMail({
        from: config.smtp.from,
        to: user.email,
        subject: 'Recupera tu contraseña - GeoSchools',
        text: `Usa este enlace para restablecer tu contraseña: ${link}`,
        html: `Usa este enlace para restablecer tu contraseña: <a href="${link}">${link}</a>`
      });
    } else {
      console.log('Password reset link:', link);
    }
  } catch(e){ console.error('Email error', e); }
  res.json({ ok: true });
});

authRouter.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if(!token || !password) return res.status(400).json({ error: 'Missing fields' });
  const rows = await query('SELECT token, user_id, expires_at FROM password_resets WHERE token=?', [token]);
  const item = rows[0];
  if(!item) return res.status(400).json({ error: 'Invalid token' });
  if(new Date(item.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Token expired' });
  const hash = await bcrypt.hash(password, 10);
  await query('UPDATE users SET password_hash=? WHERE user_id=?', [hash, item.user_id]);
  await query('DELETE FROM password_resets WHERE token=?', [token]);
  res.json({ ok: true });
});

// Update profile (first_name, last_name)
authRouter.patch('/profile', requireAuth, async (req, res) => {
  const { first_name, last_name } = req.body || {};
  if(!first_name || !last_name){ return res.status(400).json({ error: 'Missing fields' }); }
  await query('UPDATE users SET first_name=?, last_name=? WHERE user_id=?', [first_name, last_name, req.user.user_id]);
  const rows = await query('SELECT user_id, first_name, last_name, email FROM users WHERE user_id=?', [req.user.user_id]);
  res.json({ user: rows[0] });
});

// Change password
authRouter.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if(!current_password || !new_password) return res.status(400).json({ error: 'Missing fields' });
  const rows = await query('SELECT password_hash FROM users WHERE user_id=?', [req.user.user_id]);
  const user = rows[0];
  const ok = await bcrypt.compare(current_password, user.password_hash);
  if(!ok) return res.status(400).json({ error: 'Invalid current password' });
  const hash = await bcrypt.hash(new_password, 10);
  await query('UPDATE users SET password_hash=? WHERE user_id=?', [hash, req.user.user_id]);
  res.json({ ok: true });
});
