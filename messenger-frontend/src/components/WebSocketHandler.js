import { Encryption } from './Encryption';

let ws;
let offset = 0;  // Переменная для отслеживания смещения сообщений
let isConnected = false;  // Отслеживаем, установлено ли соединение

export const WebSocketHandler = {
  connect: (login, onMessageReceived) => {
    if (!isConnected){
      ws = new WebSocket('ws://localhost:3000');
      isConnected = true;

      ws.onopen = () => {
        console.log('WebSocket connection opened');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received:', data); // Логируем каждое входящее сообщение
        const decryptedMessage = Encryption.decrypt(data.message);  // Дешифруем сообщение
        console.log('Decrypted message:', decryptedMessage); // Логируем расшифрованное сообщение
        onMessageReceived({ user: data.user, message: decryptedMessage, timestamp: data.timestamp});
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        isConnected = false;
      };
    }
  },

  sendMessage: (user, message) => {
    const encryptedMessage = Encryption.encrypt(message);  // Шифруем перед отправкой
    const data = { user, message: encryptedMessage };
    ws.send(JSON.stringify(data));
  },

  // Загрузка старых сообщений (например, 30 за раз)
  loadInitialMessages: (callback) => {
    return fetch(`http://localhost:3000/messages?offset=${offset}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка загрузки сообщений');
      }
      return response.json();
    })
      .then(data => {
        offset += data.messages.length;  // Увеличиваем смещение
        callback(data.messages);  // Передаём загруженные сообщения в коллбэк
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
        callback([]);
      });
  }
};