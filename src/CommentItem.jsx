import { useState } from 'react';
import './CommentItem.css';

function CommentItem({ comment, taskId, username, onReplyAdded, level = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    
    fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        content: replyText.trim(),
        parentCommentId: comment.id,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to post reply');
        }
        return response.json();
      })
      .then(data => {
        setReplyText('');
        setShowReplyForm(false);
        
        if (onReplyAdded) {
          onReplyAdded();
        }
        setIsSubmitting(false);
      })
      .catch(err => {
        console.error('Reply error:', err);
        setIsSubmitting(false);
      });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Max 3 levels of nesting
  const maxLevel = 3;
  const canReply = level < maxLevel;

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{comment.username}</span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="comment-text">{comment.text}</p>
        
        {canReply && (
          <button 
            className="btn-reply" 
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            Reply
          </button>
        )}
      </div>

      {showReplyForm && (
        <form onSubmit={handleReply} className="reply-form">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.username}...`}
            className="reply-input"
            autoFocus
          />
          <div className="reply-actions">
            <button 
              type="submit" 
              className="btn-submit-reply"
              disabled={isSubmitting || !replyText.trim()}
            >
              Send
            </button>
            <button 
              type="button" 
              className="btn-cancel-reply"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              username={username}
              onReplyAdded={onReplyAdded}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
