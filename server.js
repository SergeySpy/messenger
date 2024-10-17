const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const sqlite3 = require('sqlite3').verbose(); // Для SQLite
const bcrypt = require('bcrypt'); // Для хеширования паролей
const cookieParser = require('cookie-parser');
const cors = require('cors');
const sqlite = require('sqlite');
const CryptoJS = require('crypto-js');

// Функция шифрования
function encryptMessage(message, secretKey) {
  return CryptoJS.AES.encrypt(message, secretKey).toString();
}

// Функция дешифрования
function decryptMessage(ciphertext, secretKey) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Настройка базы данных (SQLite)
(async () => {
  db = await sqlite.open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Создаем таблицы, если их нет
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE,
      login TEXT,
      password TEXT
    )
  `);
  
  await db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      user TEXT,
      message TEXT,
      timestamp TEXT
    )
  `);
})();

const app = express();
app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: 'http://localhost:3005', //Для прода сменить на данные хоста
  methods: ['GET', 'POST'],
  credentials: true // Разрешаем отправку куки
};
app.use(cors(corsOptions));

const saltRounds = 10;

// Регистрация нового пользователя
app.post('/register', async (req, res) => {
  const { email, login, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    await db.run("INSERT INTO users (email, login, password) VALUES (?, ?, ?)", [email, login, hash]);
    res.send('User registered successfully');
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(400).send('User already exists or invalid data');
  }
});

// Авторизация пользователя
app.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).send('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const loginCookieOptions = {
        //httpOnly: true,
        sameSite: 'Lax', // Для локальной разработки, впоследствии поменять на None при secure:true
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined, // 30 дней, если rememberMe = true
        secure: false // Отключено для тестов, но для production нужно включить для HTTPS
      };
      res.cookie('user', JSON.stringify({ email: user.email, login: user.login }), loginCookieOptions);
      res.send('Login successful');
    } else {
      res.status(400).send('Incorrect password');
    }
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Internal server error');
  }
});

// Валидация куки и автоматический вход
app.get('/validate', (req, res) => {
  if (req.cookies.user) {
    res.send(req.cookies.user);
  } else {
    res.status(401).send('Not authenticated');
  }
});

// Маршрут для подгрузки сообщений
app.get('/messages', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // Отключаем кэширование
  const limit = 30; // Количество сообщений на загрузку
  const offset = parseInt(req.query.offset) || 0; // Смещение для пагинации

  console.log(`Offset: ${offset}, Limit: ${limit}`); // Логируем значения

  try {
    const rows = await db.all("SELECT user, message, timestamp FROM messages ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    console.log('Загруженные сообщения:', rows.length); // Логируем количество загруженных сообщений
    res.json({ messages: rows });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Error fetching messages');
  }
});

// WebSocket-сервер
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Обработка WebSocket-сообщений
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Обработка входящих сообщений
  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data); //Получаем обьект { user, message }
      const { user, message } = parsedData;

      // Получаем текущие дату и время
      const timestamp = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      console.log(`Received message: ${user}: ${message}`);

      // Сохраняем сообщение в базе данных с таймстампом
      await db.run("INSERT INTO messages (user, message, timestamp) VALUES (?, ?, ?)", [user, message, timestamp]);

      // Шифруем сообщение перед отправкой клиентам
      const encryptedMessage = encryptMessage(message, 'your-secret-key'); // Убедитесь, что используется реальный ключ

      // Отправляем новое сообщение всем подключенным клиентам
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'newMessage', user, message: encryptedMessage, timestamp }));
        }
      });
    } catch (err) {
      console.error('Error handling message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Запускаем сервер
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});