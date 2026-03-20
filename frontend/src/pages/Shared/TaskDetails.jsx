import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft, UploadCloud, Send, MessageSquare,
    CheckCircle, XCircle, AlertCircle, Download, User
} from 'lucide-react';

const TaskDetails = () => {
    const navigate = useNavigate();
    const { taskId } = useParams();
    const { user } = useAuth(); // Use Real User

    // --- 1. CONTEXT (Real) ---
    const currentUser = user || { id: 0, role: 'Guest' };

    // --- 2. TASK DATA ---
    const [task, setTask] = useState({
        id: 101,
        title: "Finalize Proposal",
        status: "Submitted",
        eventId: 1,
        assigned_user_id: 502, // <--- Assigned to ME (User 502)
        desc: "Update the gold tier benefits.",
        deadline: "2025-10-15",
        submission_file: "proposal_final.pdf",
        submission_note: "Attached for review."
    });

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    // --- 3. PERMISSION LOGIC (The Fix) ---

    // Am I the one doing the work?
    const isDoer = currentUser.id === task.assigned_user_id;

    // Am I a Boss? (Exec or OC)
    // Fix: Check hierarchy_level or user_type from AuthContext
    const isExec = currentUser.hierarchy_level >= 4 || currentUser.user_type === 'Executive' || currentUser.role === 'Executive' || currentUser.role === 'executive';
    const isOC = currentUser.role_name === "Organizing_Committee";

    // CRITICAL FIX: I can only approve if I am a Boss AND NOT the Doer
    const canApprove = (isExec || isOC) && !isDoer;

    // --- ACTIONS ---
    const handleSubmit = () => {
        setTask({ ...task, status: "Submitted" });
        alert("Work Submitted! Waiting for Exec approval.");
    };

    const handleApprove = () => {
        setTask({ ...task, status: "Verified" });
        alert("Task Approved!");
    };

    const handleReject = () => {
        setTask({ ...task, status: "Rejected" }); // Or 'Assigned' to reset
        alert("Changes Requested.");
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            setComments([...comments, { user: "You", text: newComment }]);
            setNewComment("");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto mb-20">

            {/* HEADER */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-black">
                <ArrowLeft size={16} /> Back
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${task.status === 'Verified' ? 'bg-green-100 text-green-700' :
                            task.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                            }`}>
                            {task.status}
                        </span>
                        {/* Show who it is assigned to */}
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                            <User size={14} /> {isDoer ? "Assigned to You" : `Assigned to Member ${task.assigned_user_id}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">

                    {/* A. SUBMISSION STATUS (What the Member Sees) */}
                    {isDoer && task.status === 'Submitted' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                            <CheckCircle className="mx-auto text-blue-600 mb-2" size={32} />
                            <h3 className="font-bold text-blue-900">Work Submitted</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Your file <b>{task.submission_file}</b> has been sent. <br />
                                Waiting for the committee to review.
                            </p>
                        </div>
                    )}

                    {/* B. SUBMISSION FORM (Only if Pending) */}
                    {isDoer && task.status !== 'Verified' && task.status !== 'Submitted' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                            <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase flex items-center gap-2">
                                <UploadCloud size={16} /> Submit Work
                            </h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 mb-4 text-sm text-gray-500">
                                Drag & drop your file here
                            </div>
                            <button onClick={handleSubmit} className="bg-blue-600 text-white w-full py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                                Submit Task
                            </button>
                        </div>
                    )}

                    {/* C. APPROVAL BOX (Hidden for Members, Visible for Execs) */}
                    {canApprove && task.status === 'Submitted' && (
                        <div className="bg-white rounded-xl border-l-4 border-orange-400 shadow-sm p-6 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold">
                                <AlertCircle size={20} /> Review Submission
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                                <p className="italic text-gray-600 mb-2">"{task.submission_note}"</p>
                                <div className="flex items-center gap-2 text-blue-600 font-bold cursor-pointer">
                                    <Download size={16} /> {task.submission_file}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={handleApprove} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Approve</button>
                                <button onClick={handleReject} className="flex-1 border border-red-200 text-red-600 py-2 rounded font-bold hover:bg-red-50">Reject</button>
                            </div>
                        </div>
                    )}

                    {/* D. INSTRUCTIONS & CHAT (Always Visible) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-2 text-xs uppercase">Instructions</h3>
                        <p className="text-sm text-gray-600">{task.desc}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase flex items-center gap-2">
                            <MessageSquare size={16} /> Discussion
                        </h3>
                        <div className="space-y-4 mb-4">
                            {comments.map((c, i) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <span className="font-bold text-gray-900">{c.user}:</span> <span className="text-gray-600">{c.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handlePostComment} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                                placeholder="Type a message..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />
                            <button className="text-teal-600 hover:bg-teal-50 p-2 rounded"><Send size={18} /></button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TaskDetails;