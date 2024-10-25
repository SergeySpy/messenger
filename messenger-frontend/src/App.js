import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Chat } from './components/Chat';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');

  const handleLoginSuccess = (userLogin) => {
    setIsAuthenticated(true);
    setLogin(userLogin);
  };

  // Валидация сессии при монтировании компонента
  useEffect(() => {
    fetch('http://localhost:3000/validate', { method: 'GET', credentials: 'include' })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Not authenticated');
        }
      })
      .then(user => {
        handleLoginSuccess(user.login);  // Успешная аутентификация
      })
      .catch(() => {
        setIsAuthenticated(false);  // Если пользователь не авторизован
      });
  }, []);

  return (
    <div className="App">
      {isAuthenticated ? (
        <Chat login={login} />
      ) : (
        <Auth onLoginSuccess={(userLogin) => handleLoginSuccess(userLogin)} />
      )}
    </div>
  );
}

export default App;
