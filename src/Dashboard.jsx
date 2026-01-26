import { useState, useEffect } from 'react';
import { fetchAnalytics } from './services';
import TaskList from './TaskList';
import ProjectList from './ProjectList';
import ActivityTimeline from './ActivityTimeline';
import './Dashboard.css';

function Dashboard({ username, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [activeView, setActiveView] = useState('tasks');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  function loadAnalytics() {
    fetchAnalytics()
      .then(data => {
        setAnalytics(data.analytics);
        setError('');
      })
      .catch(err => {
        setError(err.error || 'Failed to load analytics');
      });
  }

  function handleLogout() {
    onLogout();
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>TaskFlow</h1>
        <div className="user-info">
          <span className="username-badge">{username}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeView === 'tasks' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('tasks')}
        >
          Tasks
        </button>
        <button
          className={activeView === 'projects' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('projects')}
        >
          Projects
        </button>
        <button
          className={activeView === 'activity' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('activity')}
        >
          Activity
        </button>
      </nav>

      {analytics && (
        <div className="analytics-panel">
          <div className="stat-card">
            <div className="stat-value">{analytics.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.pendingTasks}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.overdueTasks}</div>
            <div className="stat-label">Overdue</div>
          </div>
          {(analytics.totalEstimatedHours > 0 || analytics.totalActualHours > 0) && (
            <>
              <div className="stat-card hours-card">
                <div className="stat-value">{analytics.totalEstimatedHours.toFixed(1)}h</div>
                <div className="stat-label">Estimated Hours</div>
              </div>
              <div className="stat-card hours-card">
                <div className="stat-value">{analytics.totalActualHours.toFixed(1)}h</div>
                <div className="stat-label">Actual Hours</div>
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {activeView === 'tasks' && <TaskList username={username} />}
        {activeView === 'projects' && <ProjectList username={username} />}
        {activeView === 'activity' && <ActivityTimeline username={username} />}
      </div>
    </div>
  );
}

export default Dashboard;
