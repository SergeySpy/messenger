import React, { useState, useEffect, useRef, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Есть ли еще сообщения для подгрузки
  const chatWindowRef = useRef(null); // Создаем ссылку на окно чата
  const ws = useRef(null);
  const loadingRef = useRef(false);

  // Функция для расшифровки сообщения
  const decryptMessage = (ciphertext, secretKey) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  // Функция для подгрузки сообщений
  const loadMessages = useCallback((isInitialLoad = false) => {
    const chatWindow = chatWindowRef.current;

    if (loadingRef.current || !hasMoreMessages || !chatWindow) return; // Останавливаем подгрузку, если нет новых сообщений или идет загрузка

    // Сохраняем текущее положение скролла и высоту окна
    const currentScrollHeight = chatWindow.scrollHeight;
    const currentScrollTop = chatWindow.scrollTop;
    // Сохраняем текущее положение скролла
    //const savedScrollTop = chatWindow.scrollTop;

    loadingRef.current = true;

    console.log('Вызов loadMessages. Текущий offset:', offset, 'isInitialLoad:', isInitialLoad);

    fetch(`http://localhost:3000/messages?offset=${offset}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка загрузки сообщений');
        }
        return response.json();
      })
      .then(data => {
        console.log('Ответ с сервера:', data); // Логируем ответ сервера
        if (data.messages && data.messages.length > 0) {
          //console.log('Загруженные сообщения:', data.messages);

          setMessages(prevMessages => {
            const updatedMessages = isInitialLoad
              ? [...data.messages, ...prevMessages.reverse()] // Начальная загрузка: новые сообщения добавляем в конец
              : [...prevMessages.reverse(), ...data.messages]; // Подгрузка старых сообщений: добавляем их в начало
              console.log('Обновлённые сообщения:', updatedMessages);
            return updatedMessages.reverse();
          });

          setOffset(prevOffset => prevOffset + data.messages.length);

          if (!isInitialLoad) {
          // После добавления сообщений восстанавливаем скролл
            setTimeout(() => {
              const newScrollHeight = chatWindow.scrollHeight;
              chatWindow.scrollTop = newScrollHeight - currentScrollHeight + currentScrollTop; // Корректируем положение скролла
            }, 10);
          }

        // После загрузки восстанавливаем положение скролла
        // setTimeout(() => {
        //   chatWindow.scrollTop = savedScrollTop; // Восстанавливаем scrollTop
        // }, 0);
        } else {
          // Если больше сообщений нет, останавливаем дальнейшие подгрузки
          setHasMoreMessages(false);
          console.log('Все сообщения загружены');
        }

        loadingRef.current = false;
      })
      .catch((error) => {
        console.error('Ошибка при загрузке сообщений:', error);
        loadingRef.current = false;
      });
  }, [offset, hasMoreMessages]); // Зависимости: offset и hasMoreMessages

  // WebSocket и загрузка сообщений
  useEffect(() => {
    fetch('http://localhost:3000/validate', { method: 'GET', credentials: 'include' })
      .then(response => response.json())
      .then(user => {
        setLogin(user.login);
        setIsAuthenticated(true);
        //loadMessages(true); // Загружаем начальные сообщения после авторизации
      })
      .catch(() => setIsAuthenticated(false));

      if (!ws.current) {
      ws.current = new WebSocket('ws://localhost:3000');

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message received:', data); // Логируем каждое входящее сообщение

      if (data.type === 'newMessage') { // Проверка, что старые сообщения уже загружены
        const decryptedMessage = decryptMessage(data.message, 'your-secret-key');
        setMessages(prevMessages => [
          ...prevMessages, // Сохраняем старые сообщения
          { user: data.user, message: decryptedMessage, timestamp: data.timestamp } // Добавляем новое сообщение в конец
        ]);

        // Прокручиваем чат вниз после обновления сообщений
        // setTimeout(() => {
        //   const chatWindow = chatWindowRef.current;
        //   if (chatWindow) {
        //     chatWindow.scrollTop = chatWindow.scrollHeight; // Прокрутка вниз при получении нового сообщения
        //   }
        // }, 100); // Даем время для обновления DOM
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }
  }, [loadMessages, messages]);

  // Загрузка сообщений после полной инициализации интерфейса
  useEffect(() => {
    // Запрос к серверу для загрузки сообщений только после рендеринга
    setTimeout(() => {
      loadMessages(true);
    }, 1000); // Задержка, чтобы дать компоненту полностью отрендериться
  }, []);
  
  // useEffect(() => {
  //   // Загружаем сообщения сразу после полной инициализации компонента
  //   if (chatWindowRef.current) {
  //     loadMessages(true);
  //   }
  // }, [loadMessages]);  

  // useEffect(() => {
  //   // Прокрутка вниз после начальной загрузки сообщений
  //   if (chatWindowRef.current) {
  //     setTimeout(() => {
  //       chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  //     }, 100);
  //   }
  // }, [messages]); // Зависимость от сообщений

  const handleLogin = () => {
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe })
    })
    .then(response => {
      if (response.ok) {
        setIsAuthenticated(true);
        //loadMessages(true);
      } else {
        alert('Login failed');
      }
    })
    .catch(() => {
      alert('Error during login');
    });
  };

  const handleRegister = () => {
    fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, login, password })
    }).then(response => {
      if (response.ok) {
        alert('Registration successful');
        setIsRegistering(false);
      } else {
        response.text().then(text => alert('Registration failed: ' + text));
      }
    });
  };

  // Отправка сообщения
  const sendMessage = () => {
    if (!login || !message) return;

    if (ws.current.readyState === WebSocket.OPEN) {
      const newMessage = { user: login, message };
      ws.current.send(JSON.stringify(newMessage));
      setMessage(''); // Очищаем поле ввода
    } else {
      console.error('WebSocket is not open. Message not sent.');
    }
  };

  // Обработка нажатия клавиши "Enter"
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      // Прокрутка вниз после добавления нового сообщения
      setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 0); // Даем время для обновления DOM
    }
  }, [messages]); // Срабатывает каждый раз, когда изменяются сообщения
  

  useEffect(() => {
    const handleScroll = () => {
      const chatWindow = chatWindowRef.current;
  
      // Проверка, достиг ли пользователь верхней части чата
      if (chatWindow.scrollTop === 0 && !loadingRef.current && hasMoreMessages) {
        console.log('Пользователь достиг верхней части чата, подгружаем старые сообщения');
        loadMessages(false); // Загружаем старые сообщения
      }
    };
  
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      chatWindow.addEventListener('scroll', handleScroll);
    }
  
    // Убираем обработчик при размонтировании компонента
    return () => {
      if (chatWindow) {
        chatWindow.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadMessages, hasMoreMessages]);

  // useEffect(() => {
  //   if (!isAuthenticated) return;
    
  //   loadMessages(true); // Загружаем начальные сообщения один раз после авторизации
  // }, [loadMessages, isAuthenticated]);  
  
  // useEffect(() => {
  //   loadMessages(true); // Загружаем начальные сообщения при монтировании компонента
  // }, [loadMessages]);

  return (
    <div className="App">
      {!isAuthenticated ? (
        isRegistering ? (
          <div className="auth-form">
            <h2>Register</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Login"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button onClick={handleRegister}>Register</button>
            <button onClick={() => setIsRegistering(false)}>Cancel</button>
          </div>
        ) : (
          <div className="auth-form">
            <h2>Login</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <div>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label>Remember me</label>
            </div>
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setIsRegistering(true)}>Register</button>
          </div>
        )
      ) : (
        <div>
          <h1>Messenger</h1>
          <div className="chat-window" ref={chatWindowRef} style={{ overflowY: 'scroll', maxHeight: '400px' }}>
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.user}</strong>
                  <p>{msg.message}</p>
                  <span className="timestamp">{msg.timestamp}</span>
                </div>
              ))
            ) : (
              <p>Loading messages...</p>
            )}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;
