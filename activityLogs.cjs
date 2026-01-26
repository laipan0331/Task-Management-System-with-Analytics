const { v4: uuidv4 } = require('uuid');

const activityLogs = {};

function createLog({ username, action, resourceType, resourceId, resourceName, details = {} }) {
  const logId = uuidv4();
  const log = {
    id: logId,
    username,
    action, // 'created', 'updated', 'deleted', 'completed', 'status_changed', etc.
    resourceType, // 'task', 'project', 'comment'
    resourceId,
    resourceName,
    details,
    timestamp: Date.now(),
  };
  
  activityLogs[logId] = log;
  return log;
}

function getLogsByUser(username, limit = 50) {
  return Object.values(activityLogs)
    .filter(log => log.username === username)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

function getLogsByResource(resourceType, resourceId, limit = 20) {
  return Object.values(activityLogs)
    .filter(log => log.resourceType === resourceType && log.resourceId === resourceId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

function getAllLogs(limit = 100) {
  return Object.values(activityLogs)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

module.exports = {
  createLog,
  getLogsByUser,
  getLogsByResource,
  getAllLogs,
};
