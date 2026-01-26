const { v4: uuidv4 } = require('uuid');

const projects = {};
const projectMembers = {};

function createProject(ownerId, name, description = '', color = '#3B82F6') {
  const projectId = uuidv4();
  const project = {
    id: projectId,
    name,
    description,
    color,
    ownerId,
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  projects[projectId] = project;
  projectMembers[projectId] = [ownerId];
  
  return project;
}

function getProjectById(projectId) {
  return projects[projectId];
}

function getProjectsByUser(username) {
  return Object.values(projects).filter(p => 
    p.ownerId === username || (projectMembers[p.id] && projectMembers[p.id].includes(username))
  );
}

function updateProject(projectId, updates) {
  if(projects[projectId]) {
    projects[projectId] = {
      ...projects[projectId],
      ...updates,
      updatedAt: Date.now(),
    };
  }
  return projects[projectId];
}

function deleteProject(projectId) {
  delete projects[projectId];
  delete projectMembers[projectId];
}

function isMember(projectId, username) {
  return projectMembers[projectId] && projectMembers[projectId].includes(username);
}

function getProjectMembers(projectId) {
  return projectMembers[projectId] || [];
}

function addMember(projectId, username) {
  if(!projectMembers[projectId]) {
    projectMembers[projectId] = [];
  }
  if(!projectMembers[projectId].includes(username)) {
    projectMembers[projectId].push(username);
    return true;
  }
  return false;
}

function removeMember(projectId, username) {
  if(!projectMembers[projectId]) {
    return false;
  }
  const index = projectMembers[projectId].indexOf(username);
  if(index > -1) {
    projectMembers[projectId].splice(index, 1);
    return true;
  }
  return false;
}

module.exports = {
  createProject,
  getProjectById,
  getProjectsByUser,
  updateProject,
  deleteProject,
  isMember,
  getProjectMembers,
  addMember,
  removeMember,
};
