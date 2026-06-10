const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Асинхронная инициализация базы данных
async function initDB() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Включаем поддержку внешних ключей (на всякий случай)
  db.run('PRAGMA foreign_keys = ON');

  // Создание таблиц, если их нет
  db.run(`
    CREATE TABLE IF NOT EXISTS taxis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      podacha TEXT,
      cost TEXT,
      class TEXT,
      phone TEXT,
      description TEXT,
      contacts TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      image_url TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      about_text TEXT,
      contacts_text TEXT,
      contacts_email TEXT
    )
  `);

  // Миграция: добавляем столбцы about_image и contacts_image, если их ещё нет
  const tableInfo = db.exec("PRAGMA table_info('settings')")[0]?.values || [];
  const columnNames = tableInfo.map(row => row[1]); // row[1] — имя столбца
  if (!columnNames.includes('about_image')) {
    db.run("ALTER TABLE settings ADD COLUMN about_image TEXT");
  }
  if (!columnNames.includes('contacts_image')) {
    db.run("ALTER TABLE settings ADD COLUMN contacts_image TEXT");
  }

  // Начальные данные для такси
  const taxiCount = db.exec('SELECT COUNT(*) AS cnt FROM taxis')[0]?.values[0][0];
  if (!taxiCount) {
    const insertTaxi = (name, podacha, cost, klass, phone, desc, contacts) => {
      db.run(
        'INSERT INTO taxis (name, podacha, cost, class, phone, description, contacts) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, podacha, cost, klass, phone, desc, contacts]
      );
    };
    insertTaxi(
      'Такси Бобер', 'Подача от 5 мин', 'Стоимость от 5 руб', 'Эконом и комфорт',
      '+7 (123) 456-78-90', 'Быстрая подача, вежливые водители.',
      'Тел: +7 (123) 456-78-90, beaver@taxi.ru'
    );
    insertTaxi(
      'Такси Медведь', 'Подача от 5 мин', 'Стоимость от 5 руб', 'Эконом и комфорт',
      '+7 (123) 456-78-91', 'Надёжность и комфорт.',
      'Тел: +7 (123) 456-78-91, bear@taxi.ru'
    );
  }

  // Начальные данные для статей
  const articleCount = db.exec('SELECT COUNT(*) AS cnt FROM articles')[0]?.values[0][0];
  if (!articleCount) {
    db.run(
      'INSERT INTO articles (title, content, image_url) VALUES (?, ?, ?)',
      ['Как безопасно заказать такси',
       'Советы пассажирам: проверяйте автомобиль, делитесь поездкой...',
       'https://placehold.co/600x300/2a2a2a/F59A2F?text=Safe']
    );
    db.run(
      'INSERT INTO articles (title, content, image_url) VALUES (?, ?, ?)',
      ['Эконом vs Комфорт: что выбрать?',
       'Эконом класс — оптимальная цена. Комфорт — просторные авто...',
       'https://placehold.co/600x300/2a2a2a/F59A2F?text=Compare']
    );
  }

  // Начальные настройки (с картинками)
  const settingsExists = db.exec('SELECT COUNT(*) AS cnt FROM settings')[0]?.values[0][0];
  if (!settingsExists) {
    db.run(
      `INSERT INTO settings (id, about_text, contacts_text, contacts_email, about_image, contacts_image)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [
        'Мы собрали лучшие таксопарки города. Все данные актуальны.',
        'Свяжитесь с нами по email или через форму.',
        'info@taxi-city.ru',
        '',   // about_image — пока пусто
        ''    // contacts_image — пока пусто
      ]
    );
  }

  // Сохраняем базу на диск
  saveDB(db);

  // Обёртка методов для удобства
  return {
    db,
    SQL,
    async getAsync(sql, params = []) {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row;
    },
    async allAsync(sql, params = []) {
      const stmt = db.prepare(sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    async runAsync(sql, params = []) {
      db.run(sql, params);
      saveDB(db);
      return { changes: db.getRowsModified() };
    }
  };
}

function saveDB(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { initDB };