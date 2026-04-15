import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FileUploadForm from '../../components/FileUploadForm';
import CommentsThread from '../../components/CommentsThread';
import {
    ArrowLeft, CheckCircle, AlertCircle, Download, Clock,
    User, MessageSquare, FileText, Loader
} from 'lucide-react';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { taskId, assignmentId } = useParams();
    const { user } = useAuth();

    const [assignment, setAssignment] = useState(null);
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    const [error, setError] = useState('');
    const [localNotes, setLocalNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        console.log('[TaskDetails] taskId:', taskId, 'assignmentId:', assignmentId, 'userId:', user?.id, 'user:', user);
        if (!taskId || !assignmentId || !user?.id) {
            console.error('[TaskDetails] Missing required params - taskId:', taskId, 'assignmentId:', assignmentId, 'userId:', user?.id);
            return;
        }
        fetchTaskDetails();
    }, [taskId, assignmentId, user]);

    const fetchTaskDetails = async () => {
        try {
            setIsLoading(true);
            console.log('[TaskDetails] Fetching from:', `http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}`);
            const [assignmentRes, commentsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}`),
                fetch(`http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/comments`)
            ]);

            if (!assignmentRes.ok) {
                const errorText = await assignmentRes.text();
                console.error('[TaskDetails] API error:', assignmentRes.status, errorText);
                throw new Error(`Assignment not found: ${errorText}`);
            }

            const assignmentData = await assignmentRes.json();
            setAssignment(assignmentData);
            setLocalNotes(assignmentData.submission_text || '');

            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData || []);
            }
        } catch (err) {
            console.error('Error fetching task details:', err);
            setError('Failed to load task details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitSuccess = () => {
        setIsSubmitted(true);
        setTimeout(() => fetchTaskDetails(), 1000);
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setApprovalAction(newStatus);
            const response = await fetch(
                `http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/status`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (!response.ok) throw new Error('Failed to update status');

            // Refresh data
            fetchTaskDetails();
            
            // Emit event to refresh EventDetails page
            window.dispatchEvent(new CustomEvent('taskApproved', { 
                detail: { taskId, assignmentId, status: newStatus } 
            }));
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update status');
        } finally {
            setApprovalAction(null);
        }
    };

    const handleCommentAdded = async () => {
        // Refresh comments after new comment is added
        console.log('[TaskDetails] Refreshing comments after new comment...');
        try {
            const res = await fetch(`http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/comments`);
            if (res.ok) {
                const data = await res.json();
                console.log('[TaskDetails] Comments refreshed:', data);
                setComments(data || []);
            } else {
                console.error('[TaskDetails] Failed to refresh comments:', res.status);
            }
        } catch (err) {
            console.error('[TaskDetails] Error refreshing comments:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <Loader size={32} className="animate-spin text-teal-600" />
                    <p className="text-gray-500">Loading task details...</p>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-black">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="inline text-red-600 mr-2" size={20} />
                    <span className="text-red-700">{error || 'Task not found'}</span>
                </div>
            </div>
        );
    }

    const isAssignee = user?.id === assignment.assigned_user_id;
    const isOC = user?.role === 'Organizing_Committee' || user?.role === 'oc';
    const isExec = user?.user_type === 'Executive' || user?.role === 'Executive' || user?.role === 'executive';
    const canApprove = (isOC || isExec) && !isAssignee;
    const statusColors = {
        'Assigned': 'bg-gray-100 text-gray-700',
        'In_Progress': 'bg-blue-100 text-blue-700',
        'Submitted': 'bg-orange-100 text-orange-700',
        'Verified': 'bg-green-100 text-green-700',
        'Rejected': 'bg-red-100 text-red-700'
    };

    return (
        <div className="p-8 max-w-5xl mx-auto mb-16">
            {/* Header */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-black transition">
                <ArrowLeft size={16} /> Back
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{assignment.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusColors[assignment.assignment_status] || 'bg-gray-100'}`}>
                        {assignment.assignment_status?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-600 flex items-center gap-1">
                        <Clock size={16} />
                        Due: {new Date(assignment.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-gray-600 flex items-center gap-1">
                        <User size={16} />
                        {isAssignee ? 'Assigned to You' : `Assigned to ${assignment.assigned_to || 'Unknown'}`}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Task Description */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{assignment.desc}</p>
                    </div>

                    {/* Submission Status/Form */}
                    {isAssignee && (
                        <>
                            {assignment.assignment_status === 'Verified' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <div className="flex gap-3">
                                        <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-900">✓ Task Approved!</h3>
                                            <p className="text-sm text-green-700 mt-1">Great work! Your submission has been approved. Skills have been added to your profile.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {assignment.assignment_status === 'Rejected' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                    <div className="flex gap-3">
                                        <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-red-900">Changes Requested</h3>
                                            <p className="text-sm text-red-700 mt-1">Please review the feedback below and resubmit your work.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {['Assigned', 'In_Progress', 'Rejected'].includes(assignment.assignment_status) && assignment.proof_type !== 'None' && (
                                <FileUploadForm
                                    taskId={taskId}
                                    assignmentId={assignmentId}
                                    proofType={assignment.proof_type}
                                    onSubmitSuccess={handleSubmitSuccess}
                                    disabled={isSubmitted}
                                />
                            )}

                            {/* Notes panel for tasks with no submission required */}
                            {isAssignee && assignment.proof_type === 'None' && ['Assigned', 'In_Progress', 'Rejected'].includes(assignment.assignment_status) && (
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes & Completion</h3>
                                    <p className="text-sm text-gray-500 mb-4">Add any notes or updates about this task. Although no file is required, you must mark it as completed.</p>
                                    <div className="space-y-4">
                                        <textarea
                                            value={localNotes}
                                            onChange={(e) => setLocalNotes(e.target.value)}
                                            placeholder="Add notes about your work here..."
                                            rows={4}
                                            disabled={isSavingNotes}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setIsSavingNotes(true);
                                                        const response = await fetch(
                                                            `http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/submit-with-link`,
                                                            {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    submission_text: localNotes.trim() || 'Task completed without specific notes.',
                                                                    drive_link: null
                                                                })
                                                            }
                                                        );
                                                        if (response.ok) {
                                                            handleSubmitSuccess();
                                                        } else {
                                                            const errData = await response.json();
                                                            setError(errData.message || 'Failed to submit task');
                                                        }
                                                    } catch (err) {
                                                        setError('Failed to submit task');
                                                    } finally {
                                                        setIsSavingNotes(false);
                                                    }
                                                }}
                                                disabled={isSavingNotes}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isSavingNotes ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                Mark as Completed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {assignment.assignment_status === 'Submitted' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <div className="flex gap-3">
                                        <Loader size={24} className="text-blue-600 flex-shrink-0 animate-spin" />
                                        <div>
                                            <h3 className="font-semibold text-blue-900">Awaiting Review</h3>
                                            <p className="text-sm text-blue-700 mt-1">Your submission is being reviewed by the task committee.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submission Details (for reviewers) */}
                    {canApprove && assignment.assignment_status === 'Submitted' && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h3>
                            
                            {assignment.submission_text && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Submission Notes:</p>
                                    <p className="bg-gray-50 p-4 rounded text-gray-700 whitespace-pre-wrap text-sm">{assignment.submission_text}</p>
                                </div>
                            )}

                            {assignment.submission_file_url && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Google Drive Link:</p>
                                    <a
                                        href={assignment.submission_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 p-3 rounded border border-blue-200"
                                    >
                                        <Download size={16} />
                                        Open in Google Drive
                                    </a>
                                </div>
                            )}

                            {/* Approval Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => handleStatusUpdate('Verified')}
                                    disabled={approvalAction !== null}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {approvalAction === 'Verified' ? 'Approving...' : '✓ Approve'}
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('Rejected')}
                                    disabled={approvalAction !== null}
                                    className="flex-1 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                                >
                                    {approvalAction === 'Rejected' ? 'Rejecting...' : 'Request Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare size={20} />
                            Feedback & Discussion
                        </h3>
                        <CommentsThread
                            taskId={taskId}
                            assignmentId={assignmentId}
                            currentUserId={user?.id}
                            currentUserRole={user?.role}
                            isAssignee={isAssignee}
                            comments={comments}
                            onSubmitComment={handleCommentAdded}
                            isLoading={false}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Info Card */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Task Info</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500 font-medium">Event</dt>
                                <dd className="text-gray-900">{assignment.event_name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Priority</dt>
                                <dd>
                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        assignment.priority === 'High' ? 'bg-red-100 text-red-700' :
                                        assignment.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {assignment.priority}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium">Submission Type</dt>
                                <dd>{assignment.proof_type?.replace('_', ' ') || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Assigned To Card */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Assigned Member</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                                {assignment.assigned_to?.[0] || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{assignment.assigned_to || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{assignment.assigned_student_no || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;