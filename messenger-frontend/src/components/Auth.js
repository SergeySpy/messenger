import React, { useState } from 'react';

export function Auth({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe })
    })
  //   .then(response => response.ok ? response.json() : Promise.reject())
  //   .then(user => {
  //     onLoginSuccess(user.login);
  //   })
  //   .catch(() => alert('Login failed'));
  // };
  .then(response => {
    if (response.ok) {
      return response.json();  // Изменим на return response.text(), если сервер возвращает не JSON
    } else {
      throw new Error('Login failed');
    }
  })
  .then(user => {
    onLoginSuccess(user.login);  // Если сервер возвращает JSON с данными о пользователе
  })
  .catch(() => alert('Login failed'));
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
        alert('Registration failed');
      }
    });
  };

  return (
    <div className="auth-form">
      {isRegistering ? (
        <>
          <h2>Register</h2>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button onClick={handleRegister}>Register</button>
          <button onClick={() => setIsRegistering(false)}>Cancel</button>
        </>
      ) : (
        <>
          <h2>Login</h2>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <div>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <label>Remember me</label>
          </div>
          <button onClick={handleLogin}>Login</button>
          <button onClick={() => setIsRegistering(true)}>Register</button>
        </>
      )}
    </div>
  );
}
