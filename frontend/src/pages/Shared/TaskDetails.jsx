import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import FileUploadForm from '../../components/FileUploadForm';
import CommentsThread from '../../components/CommentsThread';
import {
    ArrowLeft, CheckCircle, AlertCircle, Download, Clock,
    User, MessageSquare, FileText, Loader
} from 'lucide-react';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { taskId, assignmentId } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const notify = useNotify();
    
    // Detect if we are in "Review/Approval" mode
    const isReviewMode = new URLSearchParams(location.search).get('mode') === 'review';

    const [assignment, setAssignment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    const [error, setError] = useState('');
    const [localNotes, setLocalNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        if (!taskId || !assignmentId || !user?.id) return;
        fetchTaskDetails();
    }, [taskId, assignmentId, user]);

    const fetchTaskDetails = async () => {
        try {
            setIsLoading(true);
            const assignmentRes = await fetch(`http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}`);
            if (!assignmentRes.ok) throw new Error(`Assignment not found`);
            const assignmentData = await assignmentRes.json();
            setAssignment(assignmentData);
            setLocalNotes(assignmentData.submission_text || '');
        } catch (err) {
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
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status');
            }

            // Emit event to refresh other pages
            window.dispatchEvent(new CustomEvent('taskApproved', { 
                detail: { taskId, assignmentId, status: newStatus } 
            }));

            // Alert success then navigate
            notify(`Submission successfully updated to: ${newStatus}`, 'success');
            navigate(-1); // Go back to dashboard/task list
            
        } catch (err) {
            console.error('Action error:', err);
            notify(err.message, 'error');
        } finally {
            setApprovalAction(null);
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
    const isOC = ['Organizing_Committee', 'oc', 'OC', 'Organizing Committee'].some(r => 
        user?.role?.includes(r) || user?.user_type?.includes(r) || user?.role_name?.includes(r)
    );
    const isExec = [
        'Executive', 'Executive_Board', 'Executive Board',
        'Junior_Treasurer', 'Junior Treasurer', 'Senior_Treasurer', 'Senior Treasurer',
        'President', 'Vice_President', 'Vice President'
    ].some(r => 
        user?.role?.includes(r) || user?.user_type?.includes(r) || user?.role_name?.includes(r)
    );

    const canApprove = (isOC || isExec) && !isAssignee;
    
    const statusColors = {
        'Assigned': 'bg-gray-100 text-gray-700',
        'In_Progress': 'bg-blue-100 text-blue-700',
        'Submitted': 'bg-orange-100 text-orange-700',
        'Verified': 'bg-green-100 text-green-700',
        'Rejected': 'bg-red-100 text-red-700',
        'Completed': 'bg-orange-100 text-orange-700'
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
                    
                    {/* Review Mode Banner / Status Headers */}
                    {isReviewMode ? (
                        <div className="bg-slate-800 p-5 rounded-xl text-white shadow-lg flex items-center justify-between border-l-4 border-teal-500">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-teal-500/20 rounded-lg">
                                    <CheckCircle size={24} className="text-teal-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base tracking-tight">Assessment Portal</h4>
                                    <p className="text-xs text-slate-400">Reviewing this submission for IMSSA Activity Compliance.</p>
                                </div>
                            </div>
                        </div>
                    ) : assignment.assignment_status === 'Rejected' ? (
                        <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 flex items-center gap-4 shadow-sm">
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-rose-900 border-b border-rose-100 pb-1 mb-1">Revisions Requested</h4>
                                <p className="text-sm text-rose-700 font-medium">Please review the discussion pool for feedback and resubmit your work.</p>
                            </div>
                        </div>
                    ) : null}

                    {/* 1. Submission Details - Premium View for Reviewers / Proof for Assignee */}
                    {(['submitted', 'completed', 'verified', 'rejected', 'in_progress'].some(s => assignment.assignment_status?.toLowerCase().includes(s))) && (
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="text-teal-600" size={24} />
                                    Submission Details
                                </h3>
                                {assignment.assignment_status === 'Verified' && (
                                    <span className="px-4 py-1.5 bg-teal-100 text-teal-800 text-[11px] font-black uppercase tracking-wider rounded-lg border border-teal-200 shadow-sm">Verified ✓</span>
                                )}
                                {assignment.assignment_status === 'Rejected' && (
                                    <span className="px-4 py-1.5 bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider rounded-lg border border-rose-200 shadow-sm">Revisions Needed</span>
                                )}
                            </div>

                            {/* Notes from Member */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Member's Statement / Notes</p>
                                <p className="text-gray-800 text-lg leading-relaxed font-medium italic whitespace-pre-wrap">
                                    "{assignment.submission_text || 'No note provided for this submission.'}"
                                </p>
                            </div>

                            {/* View Document */}
                            {assignment.submission_url && (
                                <div className="pt-2">
                                    <a
                                        href={assignment.submission_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-6 py-4 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-sm"
                                    >
                                        <Download size={20} />
                                        Open & Review Submitted Document
                                    </a>
                                </div>
                            )}

                            {/* Action Buttons for Reviewer */}
                            {canApprove && (assignment.assignment_status === 'Submitted' || isReviewMode) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => handleStatusUpdate('Approved')}
                                        disabled={approvalAction !== null}
                                        className="px-6 py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 hover:shadow-lg transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider disabled:bg-gray-400"
                                    >
                                        <CheckCircle size={20} />
                                        {approvalAction === 'Approved' ? 'Processing...' : 'Approve Task'}
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate('Rejected')}
                                        disabled={approvalAction !== null}
                                        className="px-6 py-4 bg-white text-rose-600 border-2 border-rose-100 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-wider disabled:opacity-50"
                                    >
                                        <AlertCircle size={20} />
                                        {approvalAction === 'Rejected' ? 'Processing...' : 'Needs Revisions'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. Task Description */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 uppercase tracking-widest text-xs">Task Context & Instructions</h3>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{assignment.desc}</p>
                    </div>

                    {/* 3. Assignee Interaction Zone (Upload/Notes) */}
                    {isAssignee && ['Assigned', 'In_Progress', 'Rejected'].includes(assignment.assignment_status) && (
                        <div className="space-y-6">
                            {assignment.proof_type !== 'None' ? (
                                <FileUploadForm
                                    taskId={taskId}
                                    assignmentId={assignmentId}
                                    proofType={assignment.proof_type}
                                    onSubmitSuccess={handleSubmitSuccess}
                                    disabled={isSubmitted}
                                />
                            ) : (
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Final Completion Note</h3>
                                    <p className="text-sm text-gray-500 mb-4">Add your final statement about the work and mark as completed.</p>
                                    <textarea
                                        value={localNotes}
                                        onChange={(e) => setLocalNotes(e.target.value)}
                                        placeholder="Briefly explain what you have achieved..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                                    />
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
                                                            submission_text: localNotes.trim() || 'Task completed.',
                                                            drive_link: null
                                                        })
                                                    }
                                                );
                                                if (response.ok) handleSubmitSuccess();
                                            } catch (err) {} finally { setIsSavingNotes(false); }
                                        }}
                                        className="mt-4 w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition shadow-sm"
                                    >
                                        Mark as Completed
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 uppercase tracking-widest text-[10px]">Task Blueprint</h3>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-gray-400 font-bold text-[10px] uppercase">Associated Event</dt>
                                <dd className="text-gray-900 font-bold mt-1">{assignment.event_name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 font-bold text-[10px] uppercase">Urgency Level</dt>
                                <dd className="mt-1">
                                    <span className={`inline-block px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${
                                        assignment.priority === 'High' ? 'bg-red-100 text-red-700' :
                                        assignment.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {assignment.priority}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 uppercase tracking-widest text-[10px]">Assigned Member</h3>
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

            {/* Task-Wide Pool Discussion (Group Chat) */}
            {!isReviewMode && (
                <div className="mt-12 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <MessageSquare size={28} className="text-teal-600" />
                                Task Discussion Pool
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">This context is shared with all volunteers and the executive team.</p>
                        </div>
                    </div>
                    <CommentsThread
                        taskId={taskId}
                        assignmentId={assignmentId}
                        currentUserId={user?.id}
                        currentUserRole={user?.role_name || user?.role}
                        isAssignee={isAssignee}
                    />
                </div>
            )}
        </div>
    );
};

export default TaskDetails;