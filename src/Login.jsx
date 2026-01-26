import { useState } from 'react';
import './Login.css';

function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    onLogin(username.trim())
      .catch(err => {
        setError(err.error || 'Login failed');
      });
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>TaskFlow</h1>
        <p className="subtitle">Project & Task Management</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary">
            Log In
          </button>
        </form>

        <div className="switch-form">
          <p>Don't have an account?</p>
          <button onClick={onSwitchToRegister} className="btn-link">
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
