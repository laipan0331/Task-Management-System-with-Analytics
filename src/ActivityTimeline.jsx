import { useState, useEffect } from 'react';
import './ActivityTimeline.css';

function ActivityTimeline({ username }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, project, task

  useEffect(() => {
    loadActivityLogs();
  }, [filter]);

  const loadActivityLogs = () => {
    setLoading(true);
    const queryParam = filter === 'all' ? '' : `?resourceType=${filter}`;
    
    fetch(`/api/activity-logs${queryParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load activity logs');
        }
        return response.json();
      })
      .then(data => {
        setLogs(data.logs);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now - logTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return logTime.toLocaleDateString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'commented': return '💬';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'action-created';
      case 'updated': return 'action-updated';
      case 'deleted': return 'action-deleted';
      case 'commented': return 'action-commented';
      default: return '';
    }
  };

  if (loading) {
    return <div className="activity-loading">Loading activity logs...</div>;
  }

  if (error) {
    return <div className="activity-error">{error}</div>;
  }

  return (
    <div className="activity-timeline">
      <div className="activity-header">
        <h2>Activity Timeline</h2>
        <div className="activity-filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'project' ? 'active' : ''} 
            onClick={() => setFilter('project')}
          >
            Projects
          </button>
          <button 
            className={filter === 'task' ? 'active' : ''} 
            onClick={() => setFilter('task')}
          >
            Tasks
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="activity-empty">No activity logs found</div>
      ) : (
        <div className="timeline-container">
          {logs.map((log) => (
            <div key={log.id} className={`timeline-item ${getActionColor(log.action)}`}>
              <div className="timeline-marker">
                <span className="action-icon">{getActionIcon(log.action)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-user">{log.username}</span>
                  <span className="timeline-action">{log.action}</span>
                  <span className="timeline-resource">{log.resourceType}</span>
                </div>
                <div className="timeline-name">{log.resourceName}</div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="timeline-details">
                    {log.details.statusChange && (
                      <div className="detail-item">Status: {log.details.statusChange}</div>
                    )}
                    {log.details.projectId && (
                      <div className="detail-item">Project ID: {log.details.projectId}</div>
                    )}
                  </div>
                )}
                <div className="timeline-timestamp">{formatTimestamp(log.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;
