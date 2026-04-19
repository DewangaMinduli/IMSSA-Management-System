import React, { useState } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';

const CommentsThread = ({ assignmentId, taskId, currentUserId, currentUserRole, isAssignee = false, comments = [], onSubmitComment, isLoading = false }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOC = ['Organizing_Committee', 'oc', 'OC'].includes(currentUserRole) || currentUserRole?.includes('Organizing');
    const isExec = [
        'Executive', 'executive', 'Executive_Board',
        'Junior_Treasurer', 'Senior_Treasurer',
        'President', 'Vice_President'
    ].includes(currentUserRole);
    const canComment = isOC || isExec || isAssignee;

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        const commentText = newComment.trim();
        setIsSubmitting(true);
        
        // Optimistically clear input immediately for better UX
        setNewComment('');
        
        try {
            const response = await fetch(
                `http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/comments`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUserId,
                        text: commentText
                    })
                }
            );

            if (response.ok) {
                const result = await response.json();
                console.log('[CommentsThread] Comment posted successfully:', result);
                
                // Notify parent to refresh comments
                if (onSubmitComment) {
                    onSubmitComment();
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[CommentsThread] Failed to post comment:', errorData);
                // Restore the comment text so user can try again
                setNewComment(commentText);
                const errorMsg = errorData.error || errorData.sqlMessage || errorData.message || 'Unknown error';
                alert(`Failed to post comment: ${errorMsg}`);
            }
        } catch (err) {
            console.error('[CommentsThread] Error submitting comment:', err);
            // Restore the comment text so user can try again
            setNewComment(commentText);
            alert('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Comments List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 font-medium">{canComment ? 'Start the conversation!' : 'No messages yet.'}</p>
                        <p className="text-gray-400 text-xs mt-1">Use this thread to ask questions or share updates about this task.</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.comment_id} className="space-y-2">
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                                        {comment.user[0].toUpperCase()}
                                    </div>
                                </div>

                                {/* Comment Content */}
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-gray-900 text-sm">{comment.user}</p>
                                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{comment.text}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Form - Only for OC/Exec */}
            {canComment && (
                <div className="border-t pt-4">
                    <form onSubmit={handleSubmitComment} className="space-y-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add feedback or request clarification..."
                            disabled={isSubmitting}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setNewComment('')}
                                disabled={isSubmitting || !newComment.trim()}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newComment.trim()}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Send size={16} />
                                Post
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommentsThread;
