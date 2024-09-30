import React, { useState } from 'react';

const Auth = ({ onLogin, onRegister, isRegistering, setIsRegistering }) => {
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="auth-form">
      {isRegistering ? (
        <>
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
          <button onClick={() => onRegister(email, login, password)}>Register</button>
          <button onClick={() => setIsRegistering(false)}>Cancel</button>
        </>
      ) : (
        <>
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
          <button onClick={() => onLogin(email, password, rememberMe)}>Login</button>
          <button onClick={() => setIsRegistering(true)}>Register</button>
        </>
      )}
    </div>
  );
};

export default Auth;
