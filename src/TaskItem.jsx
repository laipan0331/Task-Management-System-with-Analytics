import { useState, useEffect } from 'react';
import { fetchUpdateTask, fetchDeleteTask, fetchComments, fetchCreateComment, fetchSubtasks, fetchCreateTask } from './services';
import CommentItem from './CommentItem';
import './TaskItem.css';

function TaskItem({ task, projects, onUpdate, level = 0 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [comments, setComments] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || '',
    estimatedHours: task.estimatedHours || '',
    actualHours: task.actualHours || ''
  });
  const [error, setError] = useState('');

  const project = projects.find(p => p.id === task.projectId);

  function handleUpdate() {
    setError('');

    if (!editData.title.trim()) {
      setError('Title is required');
      return;
    }

    const updateData = {
      title: editData.title.trim(),
      description: editData.description.trim(),
      status: editData.status,
      priority: editData.priority
    };

    if (editData.dueDate) {
      updateData.dueDate = editData.dueDate;
    }

    if (editData.estimatedHours) {
      updateData.estimatedHours = parseFloat(editData.estimatedHours);
    }

    if (editData.actualHours) {
      updateData.actualHours = parseFloat(editData.actualHours);
    }

    fetchUpdateTask(task.id, updateData)
      .then(() => {
        setIsEditing(false);
        setError('');
        onUpdate();
      })
      .catch(err => {
        setError(err.error || 'Failed to update task');
      });
  }

  function handleDelete() {
    if (confirm('Are you sure you want to delete this task?')) {
      fetchDeleteTask(task.id)
        .then(() => {
          onUpdate();
        })
        .catch(err => {
          setError(err.error || 'Failed to delete task');
        });
    }
  }

  function loadComments() {
    setShowComments(!showComments);
    if (!showComments) {
      fetchComments(task.id)
        .then(data => {
          setComments(data.comments);
        })
        .catch(err => {
          setError(err.error || 'Failed to load comments');
        });
    }
  }
  
  function refreshComments() {
    fetchComments(task.id)
      .then(data => {
        setComments(data.comments);
      })
      .catch(err => {
        setError(err.error || 'Failed to reload comments');
      });
  }

  function handleAddComment(e) {
    e.preventDefault();
    setError('');

    if (!newComment.trim()) {
      return;
    }

    fetchCreateComment(task.id, newComment.trim())
      .then(() => {
        setNewComment('');
        refreshComments();
      })
      .catch(err => {
        setError(err.error || 'Failed to add comment');
      });
  }

  function loadSubtasks() {
    setShowSubtasks(!showSubtasks);
    if (!showSubtasks) {
      fetchSubtasks(task.id)
        .then(data => {
          setSubtasks(data.subtasks);
        })
        .catch(err => {
          setError(err.error || 'Failed to load subtasks');
        });
    }
  }

  function handleCreateSubtask(e) {
    e.preventDefault();
    setError('');

    if (!newSubtask.title.trim()) {
      setError('Subtask title is required');
      return;
    }

    const subtaskData = {
      title: newSubtask.title.trim(),
      description: newSubtask.description.trim(),
      projectId: task.projectId,
      parentTaskId: task.id,
      priority: task.priority,
      assignee: task.assigneeId
    };

    fetchCreateTask(subtaskData)
      .then(() => {
        setNewSubtask({ title: '', description: '' });
        setShowSubtaskForm(false);
        loadSubtasks();
        onUpdate();
      })
      .catch(err => {
        setError(err.error || 'Failed to create subtask');
      });
  }

  function getPriorityClass() {
    return `priority-${task.priority}`;
  }

  function getStatusClass() {
    return `status-${task.status}`;
  }

  function isOverdue() {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  }

  if (isEditing) {
    return (
      <div className="task-item editing">
        <div className="edit-form">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Task title"
            className="edit-input"
          />

          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
            rows="3"
            className="edit-textarea"
          ></textarea>

          <div className="edit-row">
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              className="edit-select"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
              className="edit-select"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <input
              type="date"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
              className="edit-input"
            />
          </div>

          <div className="edit-row">
            <div className="edit-field">
              <label className="edit-label">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={editData.estimatedHours}
                onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                placeholder="Estimated hours"
                className="edit-input"
              />
            </div>

            <div className="edit-field">
              <label className="edit-label">Actual Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={editData.actualHours}
                onChange={(e) => setEditData({ ...editData, actualHours: e.target.value })}
                placeholder="Actual hours"
                className="edit-input"
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="edit-actions">
            <button onClick={handleUpdate} className="btn-save">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-item ${getStatusClass()}`}>
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-badges">
          <span className={`badge ${getPriorityClass()}`}>
            {task.priority}
          </span>
          <span className="badge status">
            {task.status}
          </span>
          {isOverdue() && (
            <span className="badge overdue">Overdue</span>
          )}
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        {project && (
          <span className="meta-item">
            📁 {project.name}
          </span>
        )}
        {task.assignee && (
          <span className="meta-item">
            👤 {task.assignee}
          </span>
        )}
        {task.dueDate && (
          <span className="meta-item">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.tags && task.tags.length > 0 && (
          <span className="meta-item">
            🏷️ {task.tags.join(', ')}
          </span>
        )}
      </div>

      {(task.estimatedHours || task.actualHours) && (
        <div className="task-hours">
          {task.estimatedHours && (
            <div className="hours-item">
              <span className="hours-label">⏱️ Estimated:</span>
              <span className="hours-value">{task.estimatedHours}h</span>
            </div>
          )}
          {task.actualHours && (
            <div className="hours-item">
              <span className="hours-label">⏰ Actual:</span>
              <span className="hours-value">{task.actualHours}h</span>
            </div>
          )}
          {task.estimatedHours && task.actualHours && (
            <div className="hours-item">
              <span className="hours-label">📊 Progress:</span>
              <span className={`hours-value ${task.actualHours > task.estimatedHours ? 'over-budget' : 'on-track'}`}>
                {((task.actualHours / task.estimatedHours) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="task-actions">
        <button onClick={() => setIsEditing(true)} className="btn-action">
          Edit
        </button>
        <button onClick={handleDelete} className="btn-action delete">
          Delete
        </button>
        <button onClick={loadComments} className="btn-action">
          {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
        </button>
        {level < 2 && (
          <button onClick={loadSubtasks} className="btn-action">
            {showSubtasks ? 'Hide' : 'Show'} Subtasks ({subtasks.length})
          </button>
        )}
      </div>

      {showSubtasks && level < 2 && (
        <div className="subtasks-section">
          <div className="subtasks-header">
            <h4>Subtasks</h4>
            <button 
              onClick={() => setShowSubtaskForm(!showSubtaskForm)} 
              className="btn-add-subtask"
            >
              {showSubtaskForm ? 'Cancel' : '+ Add Subtask'}
            </button>
          </div>

          {showSubtaskForm && (
            <form onSubmit={handleCreateSubtask} className="subtask-form">
              <input
                type="text"
                value={newSubtask.title}
                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                placeholder="Subtask title..."
                className="subtask-input"
              />
              <textarea
                value={newSubtask.description}
                onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                placeholder="Description (optional)..."
                rows="2"
                className="subtask-textarea"
              ></textarea>
              <button type="submit" className="btn-create-subtask">
                Create Subtask
              </button>
            </form>
          )}

          <div className="subtasks-list">
            {subtasks.length === 0 ? (
              <p className="no-subtasks">No subtasks yet</p>
            ) : (
              subtasks.map(subtask => (
                <TaskItem
                  key={subtask.id}
                  task={subtask}
                  projects={projects}
                  onUpdate={() => {
                    loadSubtasks();
                    onUpdate();
                  }}
                  level={level + 1}
                />
              ))
            )}
          </div>
        </div>
      )}

      {showComments && (
        <div className="comments-section">
          <h4>Comments</h4>
          
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            />
            <button type="submit" className="btn-comment">
              Post
            </button>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet</p>
            ) : (
              comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  taskId={task.id}
                  username={task.assigneeId}
                  onReplyAdded={refreshComments}
                  level={0}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskItem;
