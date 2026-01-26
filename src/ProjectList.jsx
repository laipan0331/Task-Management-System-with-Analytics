import { useState, useEffect } from 'react';
import { fetchProjects, fetchCreateProject, fetchUpdateProject, fetchDeleteProject } from './services';
import ProjectMembers from './ProjectMembers';
import './ProjectList.css';

function ProjectList({ username }) {
  const [projects, setProjects] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    fetchProjects()
      .then(data => {
        setProjects(data.projects);
        setError('');
      })
      .catch(err => {
        setError(err.error || 'Failed to load projects');
      });
  }

  function handleCreateProject(e) {
    e.preventDefault();
    setError('');

    if (!newProject.name.trim()) {
      setError('Project name is required');
      return;
    }

    const projectData = {
      name: newProject.name.trim(),
      description: newProject.description.trim()
    };

    fetchCreateProject(projectData)
      .then(() => {
        setNewProject({ name: '', description: '' });
        setShowCreateForm(false);
        return loadProjects();
      })
      .catch(err => {
        setError(err.error || 'Failed to create project');
      });
  }

  function handleStartEdit(project) {
    setEditingId(project.id);
    setEditData({
      name: project.name,
      description: project.description,
      status: project.status
    });
    setError('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditData({ name: '', description: '', status: 'active' });
    setError('');
  }

  function handleUpdateProject(projectId) {
    setError('');

    if (!editData.name.trim()) {
      setError('Project name is required');
      return;
    }

    const updateData = {
      name: editData.name.trim(),
      description: editData.description.trim(),
      status: editData.status
    };

    fetchUpdateProject(projectId, updateData)
      .then(() => {
        setEditingId(null);
        setError('');
        return loadProjects();
      })
      .catch(err => {
        setError(err.error || 'Failed to update project');
      });
  }

  function handleDeleteProject(projectId, projectName) {
    if (confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      fetchDeleteProject(projectId)
        .then(() => {
          return loadProjects();
        })
        .catch(err => {
          setError(err.error || 'Failed to delete project');
        });
    }
  }

  function getStatusClass(status) {
    return `status-${status}`;
  }

  function handleMembersUpdate(projectId, newMembers) {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, members: newMembers } : p
      )
    );
  }

  function toggleProjectExpand(projectId) {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  }

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>My Projects</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-create"
        >
          {showCreateForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateProject} className="create-project-form">
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="Enter project name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Enter project description"
              rows="3"
            ></textarea>
          </div>

          <button type="submit" className="btn-submit">
            Create Project
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="projects">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects found</p>
            <p className="empty-hint">Create a new project to get started</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className={`project-card ${getStatusClass(project.status)}`}>
              {editingId === project.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Project name"
                    className="edit-input"
                  />

                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Description"
                    rows="3"
                    className="edit-textarea"
                  ></textarea>

                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="edit-select"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>

                  <div className="edit-actions">
                    <button onClick={() => handleUpdateProject(project.id)} className="btn-save">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="btn-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    <span className={`badge ${getStatusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  <div className="project-meta">
                    <span className="meta-item">
                      👤 Owner: {project.owner}
                    </span>
                    <span className="meta-item">
                      📅 Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    {project.members && project.members.length > 0 && (
                      <span className="meta-item">
                        👥 {project.members.length} member(s)
                      </span>
                    )}
                  </div>

                  <div className="project-actions">
                    {project.owner === username && (
                      <>
                        <button onClick={() => handleStartEdit(project)} className="btn-action">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="btn-action delete"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => toggleProjectExpand(project.id)} 
                      className="btn-action"
                    >
                      {expandedProjectId === project.id ? 'Hide Team' : 'Show Team'}
                    </button>
                  </div>

                  {expandedProjectId === project.id && (
                    <ProjectMembers 
                      project={project}
                      currentUsername={username}
                      onMembersUpdate={(newMembers) => handleMembersUpdate(project.id, newMembers)}
                    />
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectList;
