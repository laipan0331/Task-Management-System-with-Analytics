const { v4: uuidv4 } = require('uuid');

const tasks = {};

function createTask({ title, description, projectId, assigneeId, createdBy, priority = 'medium', dueDate, tags = [], parentTaskId = null, estimatedHours = null, actualHours = null }) {
  const taskId = uuidv4();
  const task = {
    id: taskId,
    title,
    description: description || '',
    projectId: projectId || null,
    assigneeId,
    createdBy,
    parentTaskId: parentTaskId || null,
    status: 'pending',
    priority,
    dueDate: dueDate || null,
    tags: Array.isArray(tags) ? tags : [],
    estimatedHours: estimatedHours || null,
    actualHours: actualHours || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null,
  };
  
  tasks[taskId] = task;
  return task;
}

function getTaskById(taskId) {
  return tasks[taskId];
}

function getTasksByUser(username) {
  return Object.values(tasks).filter(t => 
    t.assigneeId === username || t.createdBy === username
  );
}

function updateTask(taskId, updates) {
  if(tasks[taskId]) {
    const prevStatus = tasks[taskId].status;
    
    tasks[taskId] = {
      ...tasks[taskId],
      ...updates,
      updatedAt: Date.now(),
    };
    
    if(updates.status === 'completed' && prevStatus !== 'completed') {
      tasks[taskId].completedAt = Date.now();
    }
  }
  return tasks[taskId];
}

function deleteTask(taskId) {
  // Delete all subtasks first
  const subtasks = getSubtasks(taskId);
  subtasks.forEach(subtask => delete tasks[subtask.id]);
  
  delete tasks[taskId];
}

function getSubtasks(parentTaskId) {
  return Object.values(tasks).filter(t => t.parentTaskId === parentTaskId);
}

function getParentTask(taskId) {
  const task = tasks[taskId];
  return task && task.parentTaskId ? tasks[task.parentTaskId] : null;
}

function getRootTasks(username) {
  return Object.values(tasks).filter(t => 
    (t.assigneeId === username || t.createdBy === username) && !t.parentTaskId
  );
}

module.exports = {
  createTask,
  getTaskById,
  getTasksByUser,
  updateTask,
  deleteTask,
  getSubtasks,
  getParentTask,
  getRootTasks,
};
