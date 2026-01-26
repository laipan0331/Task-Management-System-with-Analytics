const messages = {
  'network-error': 'Unable to connect to server. Please try again.',
  'auth-missing': 'Please log in to continue.',
  'auth-insufficient': 'This username is not allowed or has insufficient permissions.',
  'required-username': 'Username is required.',
  'required-name': 'Name is required.',
  'required-title': 'Title is required.',
  'required-content': 'Content is required.',
  'invalid-username': 'Username can only contain letters, numbers, and underscores.',
  'username-exists': 'This username is already taken.',
  'project-not-found': 'Project not found.',
  'task-not-found': 'Task not found.',
  default: 'Something went wrong. Please try again.',
};

export function getErrorMessage(error) {
  return messages[error] || messages.default;
}
