const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const taxis = await req.db.allAsync('SELECT * FROM taxis ORDER BY id');
  res.render('home', { title: 'Главная', taxis });
});

router.get('/taxi/:id', async (req, res) => {
  const taxi = await req.db.getAsync('SELECT * FROM taxis WHERE id = ?', [req.params.id]);
  if (!taxi) return res.status(404).send('Таксопарк не найден');
  res.render('taxi-detail', { title: taxi.name, taxi });
});

router.get('/about', async (req, res) => {
  const settings = await req.db.getAsync('SELECT * FROM settings WHERE id = 1');
  res.render('about', { title: 'О проекте', about_text: settings.about_text });
});

router.get('/contacts', async (req, res) => {
  const settings = await req.db.getAsync('SELECT * FROM settings WHERE id = 1');
  res.render('contacts', {
    title: 'Контакты',
    contacts_text: settings.contacts_text,
    contacts_email: settings.contacts_email
  });
});

router.get('/articles', async (req, res) => {
  const articles = await req.db.allAsync('SELECT * FROM articles ORDER BY id');
  res.render('articles', { title: 'Статьи', articles });
});

router.get('/article/:id', async (req, res) => {
  const article = await req.db.getAsync('SELECT * FROM articles WHERE id = ?', [req.params.id]);
  if (!article) return res.status(404).send('Статья не найдена');
  res.render('article-detail', { title: article.title, article });
});

module.exports = router;