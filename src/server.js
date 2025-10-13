import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: (origin, cb) => cb(null, config.corsOrigin || origin || true), credentials: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// 500
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
