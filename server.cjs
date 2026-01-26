const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

const sessions = require('./sessions.cjs');
const users = require('./users.cjs');
const projects = require('./projects.cjs');
const tasks = require('./tasks.cjs');
const comments = require('./comments.cjs');
const activityLogs = require('./activityLogs.cjs');

app.use(cookieParser());
app.use(express.json());
app.use(express.static('./dist'));

// ===== AUTH MIDDLEWARE =====
function requireAuth(req, res, next) {
  const sid = req.cookies.sid;
  const username = sid ? sessions.getSessionUser(sid) : '';
  
  if(!sid || !username) {
    res.status(401).json({ error: 'auth-missing' });
    return;
  }
  
  req.username = username;
  next();
}

// ===== SESSION ROUTES =====
app.get('/api/session', (req, res) => {
  const sid = req.cookies.sid;
  const username = sid ? sessions.getSessionUser(sid) : '';
  
  if(!sid || !username) {
    res.status(401).json({ error: 'auth-missing' });
    return;
  }
  
  const user = users.getUserByUsername(username);
  res.json({ username, user });
});

app.post('/api/session', (req, res) => {
  const { username } = req.body;

  if(!username || !username.trim()) {
    res.status(400).json({ error: 'required-username' });
    return;
  }

  if(!users.isValidUsername(username)) {
    res.status(400).json({ error: 'invalid-username' });
    return;
  }

  const user = users.getUserByUsername(username);
  if(!user) {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  if(username === 'dog') {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  const sid = sessions.addSession(username);
  users.updateLastLogin(username);
  
  res.cookie('sid', sid);
  res.json({ username, user });
});

app.delete('/api/session', (req, res) => {
  const sid = req.cookies.sid;
  
  if(sid) {
    sessions.deleteSession(sid);
  }

  res.clearCookie('sid');
  res.json({ message: 'logged-out' });
});

// ===== USER ROUTES =====
app.post('/api/users', (req, res) => {
  const { username, fullName, email } = req.body;

  if(!username || !username.trim()) {
    res.status(400).json({ error: 'required-username' });
    return;
  }

  if(!users.isValidUsername(username)) {
    res.status(400).json({ error: 'invalid-username' });
    return;
  }

  if(username === 'dog') {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  if(users.getUserByUsername(username)) {
    res.status(409).json({ error: 'username-exists' });
    return;
  }

  const user = users.createUser(username, fullName, email);
  res.status(201).json({ user });
});

app.get('/api/users', requireAuth, (req, res) => {
  const allUsers = users.getAllUsers();
  res.json({ users: allUsers });
});

// ===== PROJECT ROUTES =====
app.get('/api/projects', requireAuth, (req, res) => {
  const userProjects = projects.getProjectsByUser(req.username);
  const formattedProjects = userProjects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    owner: p.ownerId,
    status: p.isArchived ? 'archived' : 'active',
    createdAt: p.createdAt,
    members: projects.getProjectMembers(p.id)
  }));
  res.json({ projects: formattedProjects });
});

app.post('/api/projects', requireAuth, (req, res) => {
  const { name, description } = req.body;

  if(!name || typeof name !== 'string' || !name.trim()) {
    console.log('Project creation failed: invalid name');
    res.status(400).json({ error: 'required-name' });
    return;
  }

  const project = projects.createProject(req.username, name.trim(), description || '');
  
  // Log activity
  activityLogs.createLog({
    username: req.username,
    action: 'created',
    resourceType: 'project',
    resourceId: project.id,
    resourceName: project.name,
  });
  
  const formattedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    owner: project.ownerId,
    status: 'active',
    createdAt: project.createdAt,
    members: projects.getProjectMembers(project.id)
  };
  res.status(201).json({ project: formattedProject });
});

app.put('/api/projects/:projectId', requireAuth, (req, res) => {
  const { projectId } = req.params;
  const { name, description, status } = req.body;

  const project = projects.getProjectById(projectId);
  if(!project) {
    res.status(404).json({ error: 'project-not-found' });
    return;
  }

  if(project.ownerId !== req.username) {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  const updates = {};
  if(name && typeof name === 'string') updates.name = name.trim();
  if(description !== undefined) updates.description = description;
  if(status !== undefined) updates.isArchived = (status === 'archived');

  const updatedProject = projects.updateProject(projectId, updates);
  
  // Log activity
  activityLogs.createLog({
    username: req.username,
    action: 'updated',
    resourceType: 'project',
    resourceId: projectId,
    resourceName: updatedProject.name,
    details: updates,
  });
  
  const formattedProject = {
    id: updatedProject.id,
    name: updatedProject.name,
    description: updatedProject.description,
    owner: updatedProject.ownerId,
    status: updatedProject.isArchived ? 'archived' : 'active',
    createdAt: updatedProject.createdAt,
    members: projects.getProjectMembers(updatedProject.id)
  };
  res.json({ project: formattedProject });
});

app.delete('/api/projects/:projectId', requireAuth, (req, res) => {
  const { projectId } = req.params;

  const project = projects.getProjectById(projectId);
  if(!project) {
    res.status(404).json({ error: 'project-not-found' });
    return;
  }

  if(project.ownerId !== req.username) {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  // Log activity before deletion
  activityLogs.createLog({
    username: req.username,
    action: 'deleted',
    resourceType: 'project',
    resourceId: projectId,
    resourceName: project.name,
  });

  projects.deleteProject(projectId);
  res.json({ message: 'project-deleted' });
});

// ===== PROJECT MEMBER ROUTES =====
app.post('/api/projects/:projectId/members', requireAuth, (req, res) => {
  const { projectId } = req.params;
  const { username } = req.body;

  const project = projects.getProjectById(projectId);
  if(!project) {
    res.status(404).json({ error: 'project-not-found' });
    return;
  }

  if(project.ownerId !== req.username) {
    res.status(403).json({ error: 'not-project-owner' });
    return;
  }

  if(!username || !users.getUserByUsername(username)) {
    res.status(400).json({ error: 'invalid-username' });
    return;
  }

  const added = projects.addMember(projectId, username);
  if(!added) {
    res.status(409).json({ error: 'already-member' });
    return;
  }

  res.json({ 
    success: true, 
    members: projects.getProjectMembers(projectId) 
  });
});

app.delete('/api/projects/:projectId/members/:username', requireAuth, (req, res) => {
  const { projectId, username } = req.params;

  const project = projects.getProjectById(projectId);
  if(!project) {
    res.status(404).json({ error: 'project-not-found' });
    return;
  }

  if(project.ownerId !== req.username) {
    res.status(403).json({ error: 'not-project-owner' });
    return;
  }

  if(username === project.ownerId) {
    res.status(400).json({ error: 'cannot-remove-owner' });
    return;
  }

  const removed = projects.removeMember(projectId, username);
  if(!removed) {
    res.status(404).json({ error: 'not-a-member' });
    return;
  }

  res.json({ 
    success: true, 
    members: projects.getProjectMembers(projectId) 
  });
});

// ===== TASK ROUTES =====
app.get('/api/tasks', requireAuth, (req, res) => {
  const { projectId, status, priority } = req.query;
  
  let userTasks = tasks.getTasksByUser(req.username);
  
  if(projectId) {
    userTasks = userTasks.filter(t => t.projectId === projectId);
  }
  if(status) {
    userTasks = userTasks.filter(t => t.status === status);
  }
  if(priority) {
    userTasks = userTasks.filter(t => t.priority === priority);
  }
  
  res.json({ tasks: userTasks });
});

app.get('/api/tasks/:taskId/subtasks', requireAuth, (req, res) => {
  const { taskId } = req.params;
  
  const task = tasks.getTaskById(taskId);
  if(!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }
  
  const subtasks = tasks.getSubtasks(taskId);
  res.json({ subtasks });
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, description, projectId, priority, dueDate, tags, assignee, parentTaskId, estimatedHours, actualHours } = req.body;

  if(!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'required-title' });
    return;
  }

  if(!projectId) {
    res.status(400).json({ error: 'required-project' });
    return;
  }

  // Validate parent task exists if provided
  if(parentTaskId) {
    const parentTask = tasks.getTaskById(parentTaskId);
    if(!parentTask) {
      res.status(404).json({ error: 'parent-task-not-found' });
      return;
    }
  }

  const task = tasks.createTask({
    title: title.trim(),
    description: description || '',
    projectId,
    assigneeId: assignee || req.username,
    createdBy: req.username,
    priority: priority || 'medium',
    dueDate,
    tags,
    parentTaskId,
    estimatedHours: estimatedHours || null,
    actualHours: actualHours || null
  });

  // Log activity
  activityLogs.createLog({
    username: req.username,
    action: 'created',
    resourceType: 'task',
    resourceId: task.id,
    resourceName: task.title,
    details: { projectId, parentTaskId },
  });

  res.status(201).json({ task });
});

app.put('/api/tasks/:taskId', requireAuth, (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;

  const task = tasks.getTaskById(taskId);
  if(!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }

  if(task.assigneeId !== req.username && task.createdBy !== req.username) {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  const updated = tasks.updateTask(taskId, updates);
  
  // Log activity
  const actionDetails = { ...updates };
  if(updates.status && updates.status !== task.status) {
    actionDetails.statusChange = `${task.status} → ${updates.status}`;
  }
  activityLogs.createLog({
    username: req.username,
    action: 'updated',
    resourceType: 'task',
    resourceId: taskId,
    resourceName: task.title,
    details: actionDetails,
  });
  
  res.json({ task: updated });
});

app.delete('/api/tasks/:taskId', requireAuth, (req, res) => {
  const { taskId } = req.params;

  const task = tasks.getTaskById(taskId);
  if(!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }

  if(task.createdBy !== req.username) {
    res.status(403).json({ error: 'auth-insufficient' });
    return;
  }

  // Log activity before deletion
  activityLogs.createLog({
    username: req.username,
    action: 'deleted',
    resourceType: 'task',
    resourceId: taskId,
    resourceName: task.title,
    details: { projectId: task.projectId },
  });

  tasks.deleteTask(taskId);
  res.json({ message: 'task-deleted' });
});

// ===== COMMENT ROUTES =====
app.get('/api/tasks/:taskId/comments', requireAuth, (req, res) => {
  const { taskId } = req.params;
  
  const task = tasks.getTaskById(taskId);
  if(!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }

  const taskComments = comments.getCommentsByTask(taskId);
  
  // Build comment tree structure
  const buildCommentTree = (comments) => {
    const commentMap = {};
    const rootComments = [];
    
    // First pass: create map and format comments
    comments.forEach(comment => {
      commentMap[comment.id] = {
        id: comment.id,
        text: comment.content,
        username: comment.userId,
        createdAt: comment.createdAt,
        parentCommentId: comment.parentCommentId,
        replies: []
      };
    });
    
    // Second pass: build tree
    Object.values(commentMap).forEach(comment => {
      if(comment.parentCommentId && commentMap[comment.parentCommentId]) {
        commentMap[comment.parentCommentId].replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });
    
    return rootComments;
  };
  
  const formattedComments = buildCommentTree(taskComments);
  res.json({ comments: formattedComments });
});

app.post('/api/tasks/:taskId/comments', requireAuth, (req, res) => {
  const { taskId } = req.params;
  const { content, parentCommentId } = req.body;

  if(!content || !content.trim()) {
    res.status(400).json({ error: 'required-content' });
    return;
  }

  const task = tasks.getTaskById(taskId);
  if(!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }
  
  // Validate parent comment exists if provided
  if(parentCommentId) {
    const parentComment = comments.getCommentById(parentCommentId);
    if(!parentComment) {
      res.status(404).json({ error: 'parent-comment-not-found' });
      return;
    }
  }

  const comment = comments.createComment(taskId, req.username, content, parentCommentId);
  
  // Log activity
  activityLogs.createLog({
    username: req.username,
    action: 'commented',
    resourceType: 'task',
    resourceId: taskId,
    resourceName: task.title,
    details: { commentId: comment.id, parentCommentId },
  });
  
  const formattedComment = {
    id: comment.id,
    text: comment.content,
    username: comment.userId,
    createdAt: comment.createdAt,
    parentCommentId: comment.parentCommentId,
    replies: []
  };
  res.status(201).json({ comment: formattedComment });
});

// ===== ACTIVITY LOG ROUTES =====
app.get('/api/activity-logs', requireAuth, (req, res) => {
  const { user, resourceType, resourceId, limit } = req.query;
  
  let logs;
  if(user) {
    logs = activityLogs.getLogsByUser(user, limit ? parseInt(limit) : 50);
  } else if(resourceType && resourceId) {
    logs = activityLogs.getLogsByResource(resourceType, resourceId, limit ? parseInt(limit) : 20);
  } else if(resourceType) {
    // Filter by resource type only
    const allLogs = activityLogs.getAllLogs(limit ? parseInt(limit) : 100);
    logs = allLogs.filter(log => log.resourceType === resourceType);
  } else {
    logs = activityLogs.getAllLogs(limit ? parseInt(limit) : 100);
  }
  
  res.json({ logs });
});

// ===== ANALYTICS ROUTES =====
app.get('/api/analytics/user', requireAuth, (req, res) => {
  const userTasks = tasks.getTasksByUser(req.username);
  
  const totalEstimated = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = userTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  
  const analytics = {
    totalTasks: userTasks.length,
    completedTasks: userTasks.filter(t => t.status === 'completed').length,
    pendingTasks: userTasks.filter(t => t.status === 'pending').length,
    inProgressTasks: userTasks.filter(t => t.status === 'in-progress').length,
    overdueTasks: userTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    highPriorityTasks: userTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    totalEstimatedHours: totalEstimated,
    totalActualHours: totalActual,
  };
  
  res.json({ analytics });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
