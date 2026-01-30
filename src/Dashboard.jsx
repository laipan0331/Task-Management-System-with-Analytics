import { useState, useEffect } from 'react';
import { fetchAnalytics, fetchTasks, fetchProjects } from './services';
import TaskList from './TaskList';
import ProjectList from './ProjectList';
import ActivityTimeline from './ActivityTimeline';
import KnowledgeGraph from './KnowledgeGraph';
import SmartSearch from './SmartSearch';
import './Dashboard.css';

function Dashboard({ username, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [activeView, setActiveView] = useState('tasks');
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadAnalytics();
    loadTasksAndProjects();
    const interval = setInterval(() => {
      loadAnalytics();
      loadTasksAndProjects();
    }, 30000);
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

  function loadTasksAndProjects() {
    Promise.all([fetchTasks(), fetchProjects()])
      .then(([tasksData, projectsData]) => {
        setTasks(tasksData.tasks || []);
        setProjects(projectsData.projects || []);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
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
          📋 Tasks
        </button>
        <button
          className={activeView === 'projects' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('projects')}
        >
          📁 Projects
        </button>
        <button
          className={activeView === 'search' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('search')}
        >
          🔍 Smart Search
        </button>
        <button
          className={activeView === 'graph' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('graph')}
        >
          🧠 Knowledge Graph
        </button>
        <button
          className={activeView === 'activity' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveView('activity')}
        >
          📊 Activity
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
        {activeView === 'search' && (
          <SmartSearch 
            tasks={tasks} 
            projects={projects}
            onResultClick={(result) => {
              if (result.type === 'task') {
                setActiveView('tasks');
              } else {
                setActiveView('projects');
              }
            }}
          />
        )}
        {activeView === 'graph' && (
          <KnowledgeGraph 
            tasks={tasks} 
            projects={projects}
            onTaskClick={(task) => {
              setActiveView('tasks');
            }}
          />
        )}
        {activeView === 'activity' && <ActivityTimeline username={username} />}
      </div>
    </div>
  );
}

export default Dashboard;
