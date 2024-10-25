import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketHandler } from './WebSocketHandler';
import { Messages } from './Messages';

export function Chat({ login }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);  // Для отслеживания, есть ли ещё сообщения
  const chatWindowRef = useRef(null);
  const loadingRef = useRef(false);  // Для предотвращения многократной загрузки

  // Прокручиваем чат вниз после загрузки сообщений
  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  // Загружаем начальные сообщения
  const loadMessages = useCallback((isInitialLoad = false) => {
    if (loadingRef.current || !hasMoreMessages) return;
    loadingRef.current = true;

    const chatWindow = chatWindowRef.current;

    // Сохраняем текущее положение скролла и высоту окна
    const currentScrollHeight = chatWindow.scrollHeight;
    const currentScrollTop = chatWindow.scrollTop;

    WebSocketHandler.loadInitialMessages((data) => {
      if (data && data.length > 0) {
        //console.log('Сообщения для обновления состояния:', data);
        function convertToISO(timestamp) {
          // Разбиваем строку на дату и время
          const [datePart, timePart] = timestamp.split(', '); // Разделяем на дату и время
          const [day, month, year] = datePart.split('.'); // Разделяем дату на компоненты
          const [hours, minutes, seconds] = timePart.split(':'); // Разделяем время на компоненты
        
          // Создаём строку в формате ISO: 'yyyy-mm-ddThh:mm:ssZ'
          const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
        
          return new Date(isoString);
        }

        setMessages(prevMessages => {
          // Объединяем старые сообщения с новыми
          const allMessages = [...prevMessages, ...data];
        
          // Сортируем по дате (предполагаем, что поле даты называется `date` и хранится в формате ISO)
          allMessages.sort((a, b) => convertToISO(a.timestamp) - convertToISO(b.timestamp));
          console.log('Полученные сообщения:', allMessages);
          return allMessages;
        });

        if (!isInitialLoad) {
        // После добавления сообщений восстанавливаем скролл
          setTimeout(() => {
            const newScrollHeight = chatWindow.scrollHeight;
            chatWindow.scrollTop = newScrollHeight - currentScrollHeight + currentScrollTop; // Корректируем положение скролла
          }, 10);
        }
      } else {
        // Если больше сообщений нет, останавливаем дальнейшие подгрузки
        setHasMoreMessages(false);
        console.log('Нет больше сообщений для загрузки');
      }

      loadingRef.current = false;
    });
  }, [hasMoreMessages]);

  // При подключении WebSocket загружаем последние сообщения
  useEffect(() => {
    WebSocketHandler.connect(login, (newMessage) => {
      // Добавляем новые сообщения в конец списка
      setMessages(prevMessages => [ ...prevMessages, newMessage ]);
      // Прокручиваем чат вниз после получения нового сообщения
      scrollToBottom();
    });

    // Загружаем начальные сообщения и сразу прокручиваем чат вниз
    loadMessages(true);
  }, [login, loadMessages]);

  // Обрабатываем скролл для подгрузки старых сообщений
  const handleScroll = useCallback(() => {
    const chatWindow = chatWindowRef.current;
    if (chatWindow && chatWindow.scrollTop === 0 && !loadingRef.current && hasMoreMessages) {
      const currentHeight = chatWindow.scrollHeight;

      // Подгружаем старые сообщения
      //loadMessages().then(() => {
        loadMessages();
        // После загрузки сохраняем положение скролла, чтобы он не прыгал
        setTimeout(() => {
          chatWindow.scrollTop = chatWindow.scrollHeight - currentHeight;
        }, 0);
      //});
    }
  }, [loadMessages, hasMoreMessages]);
  
  useEffect(() => {
    const chatWindow = chatWindowRef.current;  // Локальная переменная
    if (chatWindow) {
      chatWindow.addEventListener('scroll', handleScroll);
    }
  
    return () => {
      if (chatWindow) {
        chatWindow.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Отправляем сообщение
  const sendMessage = () => {
    if (message.trim()) {
      WebSocketHandler.sendMessage(login, message);
      setMessage('');

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  // Обработчик клавиши Enter для отправки сообщения
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    // Спускаем скролл при загрузке мессенджера
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, []);

  return (
    <div>
      <h1>Messenger</h1>
      <div className="chat-window" ref={chatWindowRef} style={{ overflowY: 'scroll', maxHeight: '400px' }}>
        <Messages messages={messages} />
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}  // Отправка сообщения по Enter
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
