const users = {};

function isValidUsername(username) {
  return !!username && username.trim() && /^[A-Za-z0-9_]+$/.test(username);
}

function createUser(username, fullName = '', email = '') {
  const user = {
    username,
    fullName: fullName || username,
    email: email || `${username}@example.com`,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  
  users[username] = user;
  return user;
}

function getUserByUsername(username) {
  return users[username];
}

function getAllUsers() {
  return Object.values(users);
}

function updateLastLogin(username) {
  if(users[username]) {
    users[username].lastLoginAt = Date.now();
  }
}

// Create some default users (except 'dog')
createUser('alice', 'Alice Johnson', 'alice@example.com');
createUser('bob', 'Bob Smith', 'bob@example.com');
createUser('charlie', 'Charlie Brown', 'charlie@example.com');

module.exports = {
  isValidUsername,
  createUser,
  getUserByUsername,
  getAllUsers,
  updateLastLogin,
};
