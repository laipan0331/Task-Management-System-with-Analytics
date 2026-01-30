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

// ===== KNOWLEDGE GRAPH & RAG ANALYTICS ROUTES =====
app.get('/api/analytics/knowledge-graph', requireAuth, (req, res) => {
  const username = req.username;
  const userTasks = tasks.getTasksByUser(username);
  const userProjects = projects.getProjectsByUser(username);
  
  // Build knowledge graph data
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  
  // Add project nodes
  userProjects.forEach(project => {
    if (!project.archived) {
      const node = {
        id: `project-${project.id}`,
        type: 'project',
        label: project.name,
        data: project
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
  });
  
  // Add task nodes and relationships
  userTasks.forEach(task => {
    const taskNode = {
      id: `task-${task.id}`,
      type: 'task',
      label: task.title,
      status: task.status,
      priority: task.priority,
      data: task
    };
    nodes.push(taskNode);
    nodeMap.set(taskNode.id, taskNode);
    
    // Task-to-project edges
    if (task.projectId) {
      const projectNodeId = `project-${task.projectId}`;
      if (nodeMap.has(projectNodeId)) {
        edges.push({
          from: taskNode.id,
          to: projectNodeId,
          type: 'belongs-to',
          weight: 1.0
        });
      }
    }
    
    // Parent-child task edges
    if (task.parentTaskId) {
      edges.push({
        from: taskNode.id,
        to: `task-${task.parentTaskId}`,
        type: 'subtask-of',
        weight: 0.8
      });
    }
    
    // Similar tasks based on tags
    userTasks.forEach(otherTask => {
      if (task.id !== otherTask.id && task.tags && otherTask.tags) {
        const similarity = calculateTagSimilarity(task.tags, otherTask.tags);
        if (similarity > 0.3) {
          edges.push({
            from: taskNode.id,
            to: `task-${otherTask.id}`,
            type: 'similar-to',
            weight: similarity
          });
        }
      }
    });
  });
  
  res.json({ nodes, edges });
});

// Multi-hop reasoning: Find related tasks through graph traversal
app.get('/api/analytics/related-tasks/:taskId', requireAuth, (req, res) => {
  const username = req.username;
  const taskId = req.params.taskId;
  const task = tasks.getTaskById(taskId);
  
  if (!task) {
    res.status(404).json({ error: 'task-not-found' });
    return;
  }
  
  if (task.createdBy !== username) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  
  const allTasks = tasks.getTasksByUser(username);
  const relatedTasks = findRelatedTasks(task, allTasks);
  
  res.json({ relatedTasks });
});

// Semantic search across tasks and projects
app.post('/api/analytics/semantic-search', requireAuth, (req, res) => {
  const username = req.username;
  const { query, mode } = req.body;
  
  if (!query || !query.trim()) {
    res.status(400).json({ error: 'query-required' });
    return;
  }
  
  const userTasks = tasks.getTasksByUser(username);
  const userProjects = projects.getProjectsByUser(username);
  
  let results = [];
  
  if (mode === 'semantic') {
    results = performSemanticSearch(query, userTasks, userProjects);
  } else {
    results = performExactSearch(query, userTasks, userProjects);
  }
  
  res.json({ results });
});

// Task recommendations based on similarity
app.get('/api/analytics/recommendations', requireAuth, (req, res) => {
  const username = req.username;
  const userTasks = tasks.getTasksByUser(username);
  
  const recommendations = generateRecommendations(userTasks);
  
  res.json({ recommendations });
});

// ===== HELPER FUNCTIONS FOR RAG & KNOWLEDGE GRAPH =====
function calculateTagSimilarity(tags1, tags2) {
  if (!tags1 || !tags2) return 0;
  const set1 = new Set(tags1.toLowerCase().split(',').map(t => t.trim()));
  const set2 = new Set(tags2.toLowerCase().split(',').map(t => t.trim()));
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

function findRelatedTasks(task, allTasks) {
  const related = [];
  
  allTasks.forEach(otherTask => {
    if (otherTask.id !== task.id) {
      let relevance = 0;
      
      // Same project
      if (otherTask.projectId === task.projectId) relevance += 0.3;
      
      // Same status
      if (otherTask.status === task.status) relevance += 0.1;
      
      // Same priority
      if (otherTask.priority === task.priority) relevance += 0.1;
      
      // Same assignee
      if (otherTask.assignedTo === task.assignedTo) relevance += 0.2;
      
      // Similar tags
      if (task.tags && otherTask.tags) {
        const tagSimilarity = calculateTagSimilarity(task.tags, otherTask.tags);
        relevance += tagSimilarity * 0.3;
      }
      
      if (relevance > 0.3) {
        related.push({
          ...otherTask,
          relevanceScore: relevance
        });
      }
    }
  });
  
  return related
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function calculateCosineSimilarity(tokens1, tokens2) {
  const allTokens = [...new Set([...tokens1, ...tokens2])];
  
  const vector1 = allTokens.map(token => tokens1.filter(t => t === token).length);
  const vector2 = allTokens.map(token => tokens2.filter(t => t === token).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

function performSemanticSearch(query, tasks, projects) {
  const queryTokens = tokenize(query);
  const results = [];
  
  // Search tasks
  tasks.forEach(task => {
    const taskText = `${task.title} ${task.description} ${task.tags || ''}`;
    const taskTokens = tokenize(taskText);
    const similarity = calculateCosineSimilarity(queryTokens, taskTokens);
    
    if (similarity > 0.2) {
      results.push({
        type: 'task',
        data: task,
        similarity: similarity,
        relevanceScore: similarity * 100
      });
    }
  });
  
  // Search projects
  projects.forEach(project => {
    if (!project.archived) {
      const projectText = `${project.name} ${project.description || ''}`;
      const projectTokens = tokenize(projectText);
      const similarity = calculateCosineSimilarity(queryTokens, projectTokens);
      
      if (similarity > 0.2) {
        results.push({
          type: 'project',
          data: project,
          similarity: similarity,
          relevanceScore: similarity * 100
        });
      }
    }
  });
  
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}

function performExactSearch(query, tasks, projects) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  tasks.forEach(task => {
    const taskText = `${task.title} ${task.description} ${task.tags || ''}`.toLowerCase();
    if (taskText.includes(lowerQuery)) {
      results.push({
        type: 'task',
        data: task,
        similarity: 1.0,
        relevanceScore: 100
      });
    }
  });
  
  projects.forEach(project => {
    if (!project.archived) {
      const projectText = `${project.name} ${project.description || ''}`.toLowerCase();
      if (projectText.includes(lowerQuery)) {
        results.push({
          type: 'project',
          data: project,
          similarity: 1.0,
          relevanceScore: 100
        });
      }
    }
  });
  
  return results;
}

function generateRecommendations(tasks) {
  const recommendations = [];
  
  // Find tasks that might be related but aren't linked
  tasks.forEach(task => {
    if (task.status !== 'completed') {
      const related = findRelatedTasks(task, tasks);
      if (related.length > 0) {
        recommendations.push({
          task: task,
          suggestions: related.slice(0, 3).map(r => ({
            task: r,
            reason: `Similar ${r.relevanceScore > 0.5 ? 'high' : 'moderate'} relevance`,
            score: r.relevanceScore
          }))
        });
      }
    }
  });
  
  return recommendations.slice(0, 10);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`RAG-Enhanced Knowledge Graph Analytics enabled`);
});
