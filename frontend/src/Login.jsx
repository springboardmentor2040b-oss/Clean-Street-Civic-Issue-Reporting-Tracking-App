import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.user.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('avatar', data.user.avatar || '');

      alert(`Logged in as ${data.user.role}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Check console.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src="logo.png" alt="Clean Street Logo" className="logo" />
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="* Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="* Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-btn">Login</button>
        </form>
        <p>
          Do not have an account? <span onClick={() => navigate('/register')} className="link-text">Register</span>
        </p>
      </div>
    </div>
  );
}

export default Login;
