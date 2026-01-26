import { useState, useEffect } from 'react';
import './ProjectMembers.css';

function ProjectMembers({ project, onMembersUpdate, currentUsername }) {
  const [members, setMembers] = useState(project.members || []);
  const [allUsers, setAllUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    setMembers(project.members || []);
  }, [project.members]);

  const loadAllUsers = () => {
    fetch('/api/users', {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        setAllUsers(data.users || []);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
      });
  };

  const handleAddMember = () => {
    if(!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');

    fetch(`/api/projects/${project.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: selectedUser }),
    })
      .then(response => {
        if(!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to add member');
          });
        }
        return response.json();
      })
      .then(data => {
        setMembers(data.members);
        setShowAddForm(false);
        setSelectedUser('');
        setError('');
        setLoading(false);
        if(onMembersUpdate) {
          onMembersUpdate(data.members);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleRemoveMember = (username) => {
    if(!confirm(`Remove ${username} from this project?`)) {
      return;
    }

    setLoading(true);
    setError('');

    fetch(`/api/projects/${project.id}/members/${username}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then(response => {
        if(!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to remove member');
          });
        }
        return response.json();
      })
      .then(data => {
        setMembers(data.members);
        setError('');
        setLoading(false);
        if(onMembersUpdate) {
          onMembersUpdate(data.members);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const availableUsers = allUsers.filter(user => 
    !members.includes(user.username) && user.username !== project.owner
  );

  const isOwner = project.owner === currentUsername;

  return (
    <div className="project-members">
      <div className="members-header">
        <h3>👥 Team Members ({members.length})</h3>
        {isOwner && (
          <button 
            className="btn-add-member"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            {showAddForm ? 'Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      {error && <div className="members-error">{error}</div>}

      {showAddForm && (
        <div className="add-member-form">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a user...</option>
            {availableUsers.map(user => (
              <option key={user.username} value={user.username}>
                {user.fullName} (@{user.username})
              </option>
            ))}
          </select>
          <button 
            onClick={handleAddMember} 
            disabled={loading || !selectedUser}
            className="btn-confirm"
          >
            Add
          </button>
        </div>
      )}

      <div className="members-list">
        {members.length === 0 ? (
          <div className="no-members">No team members yet</div>
        ) : (
          members.map(username => {
            const user = allUsers.find(u => u.username === username);
            const displayName = user ? user.fullName : username;
            const isProjectOwner = username === project.owner;
            
            return (
              <div key={username} className="member-item">
                <div className="member-info">
                  <span className="member-name">{displayName}</span>
                  <span className="member-username">@{username}</span>
                  {isProjectOwner && <span className="owner-badge">Owner</span>}
                </div>
                {isOwner && !isProjectOwner && (
                  <button 
                    className="btn-remove"
                    onClick={() => handleRemoveMember(username)}
                    disabled={loading}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProjectMembers;
