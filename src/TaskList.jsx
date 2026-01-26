import { useState, useEffect } from 'react';
import { fetchTasks, fetchProjects, fetchCreateTask } from './services';
import TaskItem from './TaskItem';
import './TaskList.css';

function TaskList({ username }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
    estimatedHours: '',
    actualHours: '',
    assignee: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadTasks, 10000);
    return () => clearInterval(interval);
  }, [filterProject, filterStatus, filterPriority]);

  function loadData() {
    Promise.all([loadTasks(), loadProjects()])
      .catch(() => {});
  }

  function loadTasks() {
    const params = {};
    if (filterProject) params.projectId = filterProject;
    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority = filterPriority;

    return fetchTasks(params)
      .then(data => {
        // Filter to show only root tasks (no parent)
        const rootTasks = data.tasks.filter(t => !t.parentTaskId);
        setTasks(rootTasks);
        setError('');
      })
      .catch(err => {
        setError(err.error || 'Failed to load tasks');
      });
  }

  function loadProjects() {
    return fetchProjects()
      .then(data => {
        console.log('Projects loaded:', data.projects);
        setProjects(data.projects);
      })
      .catch(err => {
        console.error('Failed to load projects:', err);
      });
  }

  function handleCreateTask(e) {
    e.preventDefault();
    setError('');

    console.log('Create task - newTask state:', newTask);
    console.log('Available projects:', projects);

    if (!newTask.title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!newTask.projectId) {
      setError('Please select a project');
      return;
    }

    const taskData = {
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      projectId: newTask.projectId,
      priority: newTask.priority,
      assignee: newTask.assignee || username
    };

    if (newTask.dueDate) {
      taskData.dueDate = newTask.dueDate;
    }
    if (newTask.tags.trim()) {
      taskData.tags = newTask.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (newTask.estimatedHours) {
      taskData.estimatedHours = parseFloat(newTask.estimatedHours);
    }
    if (newTask.actualHours) {
      taskData.actualHours = parseFloat(newTask.actualHours);
    }

    fetchCreateTask(taskData)
      .then(() => {
        setNewTask({
          title: '',
          description: '',
          projectId: '',
          priority: 'medium',
          dueDate: '',
          tags: '',
          estimatedHours: '',
          actualHours: '',
          assignee: ''
        });
        setShowCreateForm(false);
        return loadTasks();
      })
      .catch(err => {
        setError(err.error || 'Failed to create task');
      });
  }

  function handleTaskUpdate() {
    loadTasks();
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2>My Tasks</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-create"
        >
          {showCreateForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateTask} className="create-task-form">
          {projects.length === 0 && (
            <div className="warning-message" style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404'
            }}>
              ⚠️ No projects available. Please create a project first in the Projects tab.
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows="3"
              ></textarea>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Project *</label>
              <select
                value={newTask.projectId}
                onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assign To</label>
              <select
                value={newTask.assignee || username}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              >
                <option value={username}>Me ({username})</option>
                {newTask.projectId && projects.find(p => p.id === newTask.projectId)?.members
                  .filter(member => member !== username)
                  .map(member => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                placeholder="bug, feature, urgent"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                placeholder="e.g., 4.5"
              />
            </div>

            <div className="form-group">
              <label>Actual Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={newTask.actualHours}
                onChange={(e) => setNewTask({ ...newTask, actualHours: e.target.value })}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <button type="submit" className="btn-submit">
            Create Task
          </button>
        </form>
      )}

      <div className="filters">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="filter-select"
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tasks">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
            <p className="empty-hint">Create a new task to get started</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              projects={projects}
              onUpdate={handleTaskUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TaskList;
