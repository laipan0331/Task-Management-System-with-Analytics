import { useState, useEffect } from 'react';
import { fetchSession, fetchLogin, fetchLogout, fetchRegister } from './services';
import Loading from './Loading';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [state, setState] = useState('loading');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  function checkSession() {
    fetchSession()
      .then(data => {
        setUsername(data.username);
        setState('dashboard');
      })
      .catch(() => {
        setState('login');
      });
  }

  function handleLogin(username) {
    return fetchLogin(username)
      .then(() => {
        setUsername(username);
        setState('dashboard');
        setError('');
      });
  }

  function handleRegister(username, fullName, email) {
    return fetchRegister(username, fullName, email)
      .then(() => {
        setUsername(username);
        setState('dashboard');
        setError('');
      });
  }

  function handleLogout() {
    fetchLogout()
      .then(() => {
        setUsername('');
        setState('login');
        setError('');
      })
      .catch(err => {
        setError(err.error || 'Logout failed');
      });
  }

  function switchToRegister() {
    setState('register');
    setError('');
  }

  function switchToLogin() {
    setState('login');
    setError('');
  }

  if (state === 'loading') {
    return <Loading />;
  }

  if (state === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={switchToRegister}
      />
    );
  }

  if (state === 'register') {
    return (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={switchToLogin}
      />
    );
  }

  if (state === 'dashboard') {
    return (
      <Dashboard
        username={username}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

export default App;
