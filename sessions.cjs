const { v4: uuidv4 } = require('uuid');

const sessions = {};

function addSession(username) {
  const sid = uuidv4();
  sessions[sid] = { username, createdAt: Date.now() };
  return sid;
}

function getSessionUser(sid) {
  return sessions[sid]?.username;
}

function deleteSession(sid) {
  delete sessions[sid];
}

module.exports = {
  addSession,
  getSessionUser,
  deleteSession,
};
