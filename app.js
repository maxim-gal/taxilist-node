require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./db');
const publicRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

async function start() {
  const dbWrapper = await initDB();

  const app = express();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  }));

  app.use(express.urlencoded({ extended: false }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views', 'pages'));
  app.use(express.static(path.join(__dirname, 'public')));

  // Делаем методы доступа к БД доступными в req.db
  app.use((req, res, next) => {
    req.db = dbWrapper; // содержит getAsync, allAsync, runAsync
    next();
  });

  app.use('/', publicRoutes);
  app.use('/admin', adminRoutes);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Ошибка запуска:', err);
});