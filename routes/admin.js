const express = require('express');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

router.get('/login', (req, res) => {
  res.render('admin-login', { title: 'Вход в админку' });
});

router.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin-login', { title: 'Вход в админку', error: 'Неверный пароль' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireAdmin);

router.get('/', async (req, res) => {
  const taxis = await req.db.allAsync('SELECT * FROM taxis ORDER BY id');
  const articles = await req.db.allAsync('SELECT * FROM articles ORDER BY id');
  const settings = await req.db.getAsync('SELECT * FROM settings WHERE id = 1');
  res.render('admin', { title: 'Админ-панель', taxis, articles, settings });
});

// Такси
router.post('/taxi/add', async (req, res) => {
  const { name, podacha, cost, klass, phone, description, contacts } = req.body;
  await req.db.runAsync(
    'INSERT INTO taxis (name, podacha, cost, class, phone, description, contacts) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, podacha, cost, klass, phone, description, contacts]
  );
  res.redirect('/admin');
});

router.post('/taxi/edit/:id', async (req, res) => {
  const { name, podacha, cost, klass, phone, description, contacts } = req.body;
  await req.db.runAsync(
    'UPDATE taxis SET name=?, podacha=?, cost=?, class=?, phone=?, description=?, contacts=? WHERE id=?',
    [name, podacha, cost, klass, phone, description, contacts, req.params.id]
  );
  res.redirect('/admin');
});

router.post('/taxi/delete/:id', async (req, res) => {
  await req.db.runAsync('DELETE FROM taxis WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

// Статьи
router.post('/article/add', async (req, res) => {
  const { title, content, image_url } = req.body;
  await req.db.runAsync(
    'INSERT INTO articles (title, content, image_url) VALUES (?, ?, ?)',
    [title, content, image_url]
  );
  res.redirect('/admin');
});

router.post('/article/edit/:id', async (req, res) => {
  const { title, content, image_url } = req.body;
  await req.db.runAsync(
    'UPDATE articles SET title=?, content=?, image_url=? WHERE id=?',
    [title, content, image_url, req.params.id]
  );
  res.redirect('/admin');
});

router.post('/article/delete/:id', async (req, res) => {
  await req.db.runAsync('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

// Настройки
router.post('/settings', async (req, res) => {
  const { about_text, contacts_text, contacts_email, about_image, contacts_image } = req.body;
  await req.db.runAsync(
    `UPDATE settings SET about_text=?, contacts_text=?, contacts_email=?, about_image=?, contacts_image=? WHERE id=1`,
    [about_text, contacts_text, contacts_email, about_image, contacts_image]
  );
  res.redirect('/admin');
});

module.exports = router;