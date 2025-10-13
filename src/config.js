import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8080),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'geoschools',
  },
  corsOrigin: process.env.CORS_ORIGIN || null,
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
    jwtDays: Number(process.env.JWT_DAYS || 7)
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@geoschools.local'
  }
};
