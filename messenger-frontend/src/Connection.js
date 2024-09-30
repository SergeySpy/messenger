import { useState, useEffect } from 'react';

const useConnection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/validate', { method: 'GET', credentials: 'include' })
      .then(response => response.json())
      .then(user => {
        setLogin(user.login);
        setIsAuthenticated(true);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogin = (email, password, rememberMe) => {
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe })
    })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          alert('Login failed');
        }
      })
      .catch(() => {
        alert('Error during login');
      });
  };

  const handleRegister = (email, login, password) => {
    fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, login, password })
    })
      .then(response => {
        if (response.ok) {
          alert('Registration successful');
        } else {
          response.text().then(text => alert('Registration failed: ' + text));
        }
      });
  };

  return { isAuthenticated, login, handleLogin, handleRegister };
};

export default useConnection;
