const { v4: uuidv4 } = require('uuid');

const comments = {};

function createComment(taskId, userId, content, parentCommentId = null) {
  const commentId = uuidv4();
  const comment = {
    id: commentId,
    taskId,
    userId,
    content,
    parentCommentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  if(!comments[taskId]) {
    comments[taskId] = [];
  }
  
  comments[taskId].push(comment);
  return comment;
}

function getCommentsByTask(taskId) {
  return comments[taskId] || [];
}

function getReplies(commentId) {
  const allComments = Object.values(comments).flat();
  return allComments.filter(c => c.parentCommentId === commentId);
}

function getCommentById(commentId) {
  const allComments = Object.values(comments).flat();
  return allComments.find(c => c.id === commentId);
}

module.exports = {
  createComment,
  getCommentsByTask,
  getReplies,
  getCommentById,
};
