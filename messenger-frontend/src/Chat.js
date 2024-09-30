import React, { useState, useRef, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';

const Chat = ({ login }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const chatWindowRef = useRef(null);
  const ws = useRef(null);
  const loadingRef = useRef(false);

  const decryptMessage = (ciphertext, secretKey) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const loadMessages = useCallback((isInitialLoad = false) => {
    if (loadingRef.current || !hasMoreMessages) return;
    loadingRef.current = true;

    fetch(`http://localhost:3000/messages?offset=${offset}`)
      .then(response => response.json())
      .then(data => {
        if (data.messages.length > 0) {
          setMessages(prevMessages => isInitialLoad
            ? [...prevMessages, ...data.messages.reverse()]
            : [...data.messages.reverse(), ...prevMessages]);
          setOffset(prevOffset => prevOffset + data.messages.length);
        } else {
          setHasMoreMessages(false);
        }
        loadingRef.current = false;
      })
      .catch(() => {
        loadingRef.current = false;
      });
  }, [offset, hasMoreMessages]);

  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket('ws://localhost:3000');
      ws.current.onopen = () => console.log('WebSocket connection opened');
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newMessage') {
          const decryptedMessage = decryptMessage(data.message, 'your-secret-key');
          setMessages(prevMessages => [...prevMessages, { user: data.user, message: decryptedMessage, timestamp: data.timestamp }]);
          setTimeout(() => {
            if (chatWindowRef.current) {
              chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
            }
          }, 100);
        }
      };
      ws.current.onerror = (error) => console.error('WebSocket error:', error);
      ws.current.onclose = () => console.log('WebSocket connection closed');
      return () => ws.current.close();
    }
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      setTimeout(() => {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (!login || !message) return;
    if (ws.current.readyState === WebSocket.OPEN) {
      const newMessage = { user: login, message };
      ws.current.send(JSON.stringify(newMessage));
      setMessage('');
    } else {
      console.error('WebSocket is not open. Message not sent.');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const chatWindow = chatWindowRef.current;
      if (chatWindow && chatWindow.scrollTop === 0 && !loadingRef.current && hasMoreMessages) {
        loadMessages(false);
      }
    };
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      chatWindow.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatWindow) {
        chatWindow.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadMessages, hasMoreMessages]);

  return (
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
  );
};

export default Chat;
