import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "./Style/login&registerpage.css"
const API_URL = 'https://chatappbackend-y3rm.onrender.com/';

function Login({ logIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      logIn(data.token, data.username);
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="app-logo">
          <h1 className="app-name">ChitChat</h1>
        </div>
        
        <h2>Welcome Back</h2>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit">Login</button>
        </form>
        
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;