import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Edit, Edit2, Clock, Users, Plus, X, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import EditEventModal from '../../components/EditEventModal';
import { useAuth } from '../../context/AuthContext';
import { Bell, Home } from 'lucide-react';
import UserDropdown from '../../components/UserDropdown';
import CommentsThread from '../../components/CommentsThread';
import { MessageCircle as MessageIcon } from 'lucide-react';

const UnifiedEventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifications = [];

    const [availableSkills, setAvailableSkills] = useState([]);

    const loadSkills = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/skills');
            if (res.ok) setAvailableSkills(await res.json());
        } catch (err) {}
    };

    useEffect(() => {
        loadSkills();
    }, []);

    const [activeTab, setActiveTab] = useState('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'High', deadline: '', assignedTo: [], is_volunteer_opportunity: false, proof_type: 'None', skills: [], volunteer_limit: 5 });
    const [taskAssignInputValue, setTaskAssignInputValue] = useState('');

    const [showOcModal, setShowOcModal] = useState(false);
    const [newOC, setNewOC] = useState({ name: '', student_number: '', role: 'Organizing Committee Member' });
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // PARTNERSHIPS STATE
    const [partnerships, setPartnerships] = useState([]); // Kept for modal inputs or we can just use newPartner 
    // Actually we will map directly over data?.partnerships

    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [newPartner, setNewPartner] = useState({
        company_name: '',
        contact_person: '',
        package_type: 'Monetary',
        amount_promised: '',
        status: 'Paid'
    });

    // OVERVIEW & TIMELINE STATE
    const [showOverviewModal, setShowOverviewModal] = useState(false);
    const [editOverviewData, setEditOverviewData] = useState({ event_name: '', description: '', venue: '', start_date: '', end_date: '' });

    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [newTimeline, setNewTimeline] = useState({ title: '', date: '' });

    const [editOcStudentId, setEditOcStudentId] = useState('');

    // TIMELINE EDIT STATE
    const [editTimelineId, setEditTimelineId] = useState(null);
    const [editTimelineData, setEditTimelineData] = useState({ title: '', date: '' });

    const [showDiscussionTask, setShowDiscussionTask] = useState(null);

    const handleSaveTimelineEdit = async (timelineId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/timeline/${timelineId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editTimelineData)
            });
            if (res.ok) {
                setEditTimelineId(null);
                fetchEventDetails();
            } else {
                alert('Error updating timeline stage');
            }
        } catch (err) { console.error(err); }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editTaskId) {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}/tasks/${editTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        ...newTask,
                        assigned_users: newTask.assignedTo,
                        assignedTo: undefined
                    })
                });
                if (res.ok) {
                    setShowTaskModal(false);
                    setEditTaskId(null);
                    setNewTask({ title: '', description: '', priority: 'High', deadline: '', assignedTo: [], is_volunteer_opportunity: false, proof_type: 'None', skills: [], volunteer_limit: 5 });
                    setTaskAssignInputValue('');
                    fetchEventDetails();
                } else {
                    const data = await res.json();
                    alert(data.message || 'Error updating task');
                }
            } else {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        ...newTask,
                        assigned_users: newTask.assignedTo,
                        assignedTo: undefined
                    })
                });
                if (res.ok) {
                    setShowTaskModal(false);
                    setNewTask({ title: '', description: '', priority: 'High', deadline: '', assignedTo: [], is_volunteer_opportunity: false, proof_type: 'None', skills: [], volunteer_limit: 5 });
                    setTaskAssignInputValue('');
                    fetchEventDetails();
                } else {
                    const data = await res.json();
                    alert(data.message || 'Error adding task');
                }
            }
        } catch (err) {
            console.error('Error adding/updating task', err);
        }
    };

    const handleSearchStudent = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const res = await fetch(`http://localhost:5000/api/users/search?q=${query}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (err) {}
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectStudent = (student) => {
        setNewOC(prev => ({ ...prev, name: student.full_name, student_number: student.student_no }));
        setSearchQuery(student.student_no || student.full_name);
        setShowSuggestions(false);
    };

    const handleAddOC = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/oc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ student_id: newOC.student_number, role: newOC.role })
            });
            if (res.ok) {
                setShowOcModal(false);
                setNewOC({ name: '', student_number: '', role: 'Organizing Committee Member' });
                setSearchQuery('');
                fetchEventDetails();
            } else {
                const data = await res.json();
                alert(data.message || 'Error adding OC Member: Check if student exists or is already added.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveRole = async (eoId) => {
        try {
            const token = localStorage.getItem('token');
            console.log("Saving OC:", { eoId, designation: editRoleStr, student_id: editOcStudentId });
            const res = await fetch(`http://localhost:5000/api/events/oc/${eoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ designation: editRoleStr, student_id: editOcStudentId })
            });
            if (res.ok) {
                setEditingOcId(null);
                setEditRoleStr('');
                setEditOcStudentId('');
                fetchEventDetails();
            } else {
                const data = await res.json();
                alert(data.message || 'Error saving role or student ID. Make sure student ID is valid.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchEventDetails();
        } catch (err) { console.error(err); }
    };

    const handleCancelTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to cancel this task?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'Cancelled' })
            });
            if (res.ok) fetchEventDetails();
        } catch (err) { console.error(err); }
    };

    const handleEditOverview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editOverviewData)
            });
            if (res.ok) {
                setShowOverviewModal(false);
                fetchEventDetails();
            }
        } catch (err) { console.error(err); }
    };

    const handleAddTimeline = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/timeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newTimeline)
            });
            if (res.ok) {
                setShowTimelineModal(false);
                setNewTimeline({ title: '', date: '' });
                fetchEventDetails();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteTimeline = async (timelineId) => {
        if (!window.confirm("Are you sure you want to delete this stage?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/timeline/${timelineId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchEventDetails();
        } catch (err) { console.error(err); }
    };

    const handleDeletePartnership = async (partnershipId) => {
        if (!window.confirm("Are you sure you want to delete this partnership?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/partnerships/${partnershipId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchEventDetails();
        } catch (err) { console.error(err); }
    };

    const handleUpdateTaskStatus = async (taskId, assignmentId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/assignments/${assignmentId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchEventDetails();
            }
        } catch (err) { console.error('Error updating status', err); }
    };

    const handleApproveTask = (taskId) => {
        console.log("Approve task", taskId);
    };

    // --- SERVER STATE ---
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Management roles: Executive Board (3), Junior Treasurer (4), President (5)
    const isExecutive = user?.hierarchy_level >= 3 && user?.hierarchy_level <= 5;
    const isPresident = user?.hierarchy_level === 5;
    const isStaff = user?.hierarchy_level >= 6 || user?.user_type === 'Academic_Staff';
    
    const [isOC, setIsOC] = useState(false);
    // ST and Academic Staff are NOT managers for events; they only have viewing access.
    // OC members (2) can manage their specific event.
    const canManage = (isExecutive || isOC) && !isStaff;
    const isReadOnly = !canManage;

    const [editingId, setEditingId] = useState(null);

    const [editingOcId, setEditingOcId] = useState(null);
    const [editRoleStr, setEditRoleStr] = useState('');
    const PREDEFINED_ROLES = [
        "Main Coordinator", "Finance Coordinator", "Marketing Coordinator",
        "PR Coordinator", "Secretary", "Partnership Coordinator",
        "Editor-in-Chief", "Organizing Committee Member"
    ];

    const fetchEventDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/details`);
            if (res.ok) {
                const fetchedData = await res.json();
                setData(fetchedData);
                // Check if user is in OC
                if (fetchedData.committee) {
                    const found = fetchedData.committee.some(c => c.id === user?.student_no);
                    setIsOC(found);
                }
            }
        } catch (err) { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [eventId, user]);

    // Listen for task approval from TaskDetails page and refresh
    useEffect(() => {
        const handleTaskApproved = () => fetchEventDetails();
        window.addEventListener('taskApproved', handleTaskApproved);
        return () => window.removeEventListener('taskApproved', handleTaskApproved);
    }, []);



    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Event deleted successfully!");
                navigate(-1);
            }
        } catch (err) { }
    };

    const handleEditSuccess = () => fetchEventDetails();

    if (loading) return <div className="p-8 max-w-7xl mx-auto flex justify-center items-center h-48"><p className="text-gray-500 font-medium animate-pulse">Loading Event Details...</p></div>;
    if (!data || !data.event) return <div className="p-8 text-center mt-10"><h2 className="text-xl font-bold">Event Not Found</h2></div>;

    const { event, tasks, committee: ocMembers, timeline, partnerships: dbPartnerships = [] } = data;

    // TAB RENDER FUNCTIONS
    const renderOverview = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Event Description</h3>
                {canManage && (
                    <button 
                        onClick={() => { 
                            setEditOverviewData({ 
                                event_name: event.event_name, 
                                description: event.description || '', 
                                venue: event.venue || '', 
                                start_date: event.start_date ? event.start_date.split('T')[0] : '', 
                                end_date: event.end_date ? event.end_date.split('T')[0] : '' 
                            }); 
                            setShowOverviewModal(true); 
                        }} 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit Overview
                    </button>
                )}
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 via-white to-teal-50 rounded-xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 opacity-20 rounded-bl-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 opacity-20 rounded-tr-full pointer-events-none"></div>
                
                <h4 className="text-xl font-bold text-indigo-900 mb-4">{event.event_name}</h4>
                <p className="text-gray-700 text-base mb-8 leading-relaxed whitespace-pre-wrap relative z-10">{event.description || <span className="italic text-gray-400">No specific description provided. Update overview to add a description.</span>}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-gray-200/60 pt-6 relative z-10">
                    <div className="bg-white/60 p-4 rounded-lg border border-white/80 shadow-sm backdrop-blur-sm">
                        <span className="font-bold text-indigo-900/60 block mb-2 uppercase tracking-wide text-xs">Venue</span>
                        <span className="text-gray-900 font-medium flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Home size={14}/></span>
                            {event.venue || 'TBA'}
                        </span>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-white/80 shadow-sm backdrop-blur-sm">
                        <span className="font-bold text-teal-900/60 block mb-2 uppercase tracking-wide text-xs">Start Date</span>
                        <span className="text-gray-900 font-medium flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><Calendar size={14}/></span>
                            {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBA'}
                        </span>
                    </div>
                    <div className="bg-white/60 p-4 rounded-lg border border-white/80 shadow-sm backdrop-blur-sm">
                        <span className="font-bold text-orange-900/60 block mb-2 uppercase tracking-wide text-xs">End Date</span>
                        <span className="text-gray-900 font-medium flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Calendar size={14}/></span>
                            {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBA'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTasks = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Task Summary</h3>
                {canManage && (
                    <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                        <Plus size={16} /> Add Task
                    </button>
                )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Task</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Deadline</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Discussion</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{task.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">{task.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {task.is_volunteer_opportunity ? (
                                            <span className="text-purple-500 font-semibold italic">Open for Volunteer</span>
                                        ) : task.assignedTo ? (
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-bold">{task.assignedTo}</span>
                                                <span className="text-gray-500 text-xs">{task.assignedStudentNumbers}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Unassigned</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.is_volunteer_opportunity ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.is_volunteer_opportunity ? 'Volunteer' : 'Assigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.assignment_id ? (
                                        <button 
                                            onClick={() => setShowDiscussionTask(task)}
                                            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all hover:bg-indigo-100"
                                        >
                                            <MessageIcon size={14} />
                                            Chat
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No assignment</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {canManage ? (
                                        <div className="flex items-center gap-2">
                                            <select 
                                                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none text-gray-700 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm" 
                                                value={task.status || 'Pending'}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    fetch(`http://localhost:5000/api/events/${eventId}/tasks/${task.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                                        body: JSON.stringify({ status: newStatus })
                                                    }).then(res => { if(res.ok) fetchEventDetails(); });
                                                }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Submitted">Submitted</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Declined">Declined</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    setEditTaskId(task.id);
                                                    // Parse volunteer limit from description (format: <!--VL:N-->)
                                                    const volMatch = task.description?.match(/<!--VL:(\d+)-->/);
                                                    const volLimit = volMatch ? parseInt(volMatch[1]) : 5;
                                                    const cleanDesc = task.description?.replace(/<!--VL:\d+-->/, '') || '';
                                                    setNewTask({
                                                        title: task.title || '',
                                                        description: cleanDesc,
                                                        priority: task.priority || 'Medium',
                                                        deadline: task.deadline ? task.deadline.split('T')[0] : '',
                                                        assignedTo: task.assignedStudentNumbers ? task.assignedStudentNumbers.split(',').map(s => s.trim()) : [],
                                                        is_volunteer_opportunity: !!task.is_volunteer_opportunity,
                                                        proof_type: task.proof_type || 'None',
                                                        status: task.status || 'Pending',
                                                        skills: task.skills || [],
                                                        volunteer_limit: volLimit
                                                    });
                                                    setShowTaskModal(true);
                                                }}
                                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                                title="Edit Task"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)} 
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                                                title="Delete Task"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">Read Only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">No tasks assigned yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderOC = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">OC Members</h3>
                {canManage && (
                    <button onClick={() => setShowOcModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                        <Plus size={16} /> Add OC
                    </button>
                )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Student ID</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {ocMembers.map(member => (
                            <tr key={member.eo_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{member.name}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {editingOcId === member.eo_id ? (
                                        <input
                                            className="w-full border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={editOcStudentId}
                                            onChange={e => setEditOcStudentId(e.target.value)}
                                            placeholder="Student ID"
                                        />
                                    ) : (
                                        member.student_id || member.id
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {editingOcId === member.eo_id ? (
                                        <>
                                            <input
                                                list="role-suggestions"
                                                className="w-full border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                value={editRoleStr}
                                                onChange={(e) => setEditRoleStr(e.target.value)}
                                                placeholder="Custom Role or Select..."
                                            />
                                            <datalist id="role-suggestions">
                                                {PREDEFINED_ROLES.map(r => <option key={r} value={r} />)}
                                            </datalist>
                                        </>
                                    ) : (
                                        member.role
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingOcId === member.eo_id ? (
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleSaveRole(member.eo_id)} 
                                                className="text-green-600 font-bold text-xs hover:bg-green-50 px-2 py-1 rounded border border-green-200 transition-colors flex items-center gap-1"
                                            >
                                                <CheckCircle size={14} /> Save
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setEditingOcId(null);
                                                    setEditOcStudentId('');
                                                    setEditRoleStr('');
                                                }} 
                                                className="text-gray-400 font-bold text-xs hover:bg-gray-50 px-2 py-1 rounded border border-gray-200 transition-colors flex items-center gap-1"
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            {canManage ? (
                                                <>
                                                    <button 
                                                        onClick={() => { 
                                                            setEditingOcId(member.eo_id); 
                                                            setEditRoleStr(member.role); 
                                                            setEditOcStudentId(member.student_id || member.id || ''); 
                                                        }} 
                                                        className="text-blue-500 hover:text-blue-700 transition flex items-center gap-1 text-xs font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                                    >
                                                        <Edit2 size={12} /> Edit
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if(!window.confirm("Remove this member from OC?")) return;
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const res = await fetch(`http://localhost:5000/api/events/oc/${member.eo_id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (res.ok) fetchEventDetails();
                                                            } catch (err) {}
                                                        }} 
                                                        className="text-red-500 hover:text-red-700 transition flex items-center gap-1 text-xs font-semibold bg-red-50 px-2 py-1 rounded border border-red-100"
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Read Only</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Partnerships functions

    const handleAddPartner = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editingId) {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}/partnerships/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(newPartner)
                });
                if (res.ok) {
                    setEditingId(null);
                    setShowPartnerModal(false);
                    setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Pending' });
                    fetchEventDetails();
                }
            } else {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}/partnerships`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(newPartner)
                });
                if (res.ok) {
                    setShowPartnerModal(false);
                    setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Pending' });
                    fetchEventDetails();
                }
            }
        } catch (err) { console.error('Error saving partnership:', err); }
    };

    const handleEditPartner = (partner) => {
        setNewPartner(partner);
        setEditingId(partner.partnership_id);
        setShowPartnerModal(true);
    };

    const renderPartnerships = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Partnerships</h3>
                {canManage && (
                    <button onClick={() => { setEditingId(null); setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Paid' }); setShowPartnerModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                        <Plus size={16} /> Add Partner
                    </button>
                )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden min-h-[200px] overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Company Name</th>
                            <th className="px-6 py-4">Contact Person</th>
                            <th className="px-6 py-4">Package</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {dbPartnerships.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400 italic">
                                    No partnerships added yet.
                                </td>
                            </tr>
                        ) : (
                            dbPartnerships.map(p => (
                                <tr key={p.partnership_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{p.company_name}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.contact_person}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.package_type}</td>
                                    <td className="px-6 py-4 text-green-700 font-semibold">{p.amount_promised}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            {canManage ? (
                                                <>
                                                    <button onClick={() => handleEditPartner(p)} className="text-blue-600 font-medium text-xs hover:underline flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                                                    <button onClick={() => handleDeletePartnership(p.partnership_id)} className="text-red-500 font-medium text-xs hover:underline flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Read Only</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PARTNER MODAL IN PLACE */}
            {showPartnerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
                    <div className="bg-white p-6 rounded-xl w-[500px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{editingId ? 'Edit Partner' : 'Add Partner'}</h3>
                            <button onClick={() => setShowPartnerModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddPartner} className="space-y-4">
                            <input required placeholder="Company Name" className="w-full border p-2 rounded text-sm" value={newPartner.company_name} onChange={e => setNewPartner({ ...newPartner, company_name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="Contact Person" className="w-full border p-2 rounded text-sm" value={newPartner.contact_person} onChange={e => setNewPartner({ ...newPartner, contact_person: e.target.value })} />
                                <input required type="email" placeholder="Email" className="w-full border p-2 rounded text-sm" value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input list="package-dropdown" placeholder="Type Package or Select..." className="w-full border p-2 rounded text-sm" value={newPartner.package_type} onChange={e => setNewPartner({ ...newPartner, package_type: e.target.value })} />
                                <datalist id="package-dropdown">
                                    <option value="Monetary" />
                                    <option value="Beverage" />
                                    <option value="Gift Partner" />
                                </datalist>
                                <input placeholder="Amount Promised (if any)" className="w-full border p-2 rounded text-sm" type="text" value={newPartner.amount_promised} onChange={e => setNewPartner({ ...newPartner, amount_promised: e.target.value })} />
                            </div>
                            <select className="w-full border border-gray-200 p-3 rounded text-sm outline-none" value={newPartner.status} onChange={e => setNewPartner({ ...newPartner, status: e.target.value })}>
                                <option value="Paid">Paid</option>
                                <option value="Declined">Declined</option>
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">{editingId ? 'Update Partner' : 'Add Partner'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderTimeline = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Event Timeline</h3>
                {canManage && (
                    <button onClick={() => setShowTimelineModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                        <Plus size={16} /> Add Stage
                    </button>
                )}
            </div>
            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                {timeline.map((item, index) => (
                    <div key={item.id} className="ml-8 relative">
                        <span className="absolute -left-[41px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-teal-500">
                            {index + 1}
                        </span>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors group">
                            {editTimelineId === item.id ? (
                                <div className="flex gap-4 flex-1 items-center">
                                    <input value={editTimelineData.title} onChange={e => setEditTimelineData({...editTimelineData, title: e.target.value})} className="border border-gray-300 p-2 rounded text-sm w-1/2" />
                                    <input type="date" value={editTimelineData.date} onChange={e => setEditTimelineData({...editTimelineData, date: e.target.value})} className="border border-gray-300 p-2 rounded text-sm w-1/4" />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSaveTimelineEdit(item.id)} className="text-green-600 font-bold text-xs hover:underline">Save</button>
                                        <button onClick={() => setEditTimelineId(null)} className="text-gray-500 font-bold text-xs hover:underline">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                            <Clock size={12} /> {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {canManage ? (
                                            <>
                                                <button onClick={() => { setEditTimelineId(item.id); setEditTimelineData({ title: item.title, date: item.date.split('T')[0] }); }} className="text-white bg-blue-400 hover:bg-blue-500 rounded-md p-1.5 transition-colors opacity-0 group-hover:opacity-100 shadow-sm" title="Edit Phase">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteTimeline(item.id)} className="text-white bg-red-400 hover:bg-red-500 rounded-md p-1.5 transition-colors opacity-0 group-hover:opacity-100 shadow-sm" title="Delete Phase">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Read Only</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans relative">
            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Back Button & Title */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <ArrowLeft className="cursor-pointer text-gray-600 hover:text-gray-900" size={20} onClick={() => navigate(-1)} />
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">{event.event_name}</h2>
                                <span className={`px-3 py-1 rounded text-xs font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} /> {new Date(event.start_date).toLocaleDateString()} - {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBD'}
                            </div>
                        </div>
                    </div>
                    {/* Header Controls */}
                    <div className="flex gap-3 mt-4 sm:mt-0 ml-10 sm:ml-0">
                        {isPresident && (
                            <button
                                onClick={handleDelete}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                <Trash2 size={16} /> Delete Event
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="border-b border-gray-200 mb-8">
                    <div className="flex gap-8">
                        {['Overview', 'Tasks', 'OC', 'Timeline', 'Partnerships']
                          .filter(tab => tab !== 'Partnerships' || isExecutive)
                          .map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-800'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'Tasks' && renderTasks()}
                    {activeTab === 'OC' && renderOC()}
                    {activeTab === 'Timeline' && renderTimeline()}
                    {activeTab === 'Partnerships' && renderPartnerships()}
                </div>
            </div>

            {/* MODALS */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-8 rounded-xl w-[450px] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-900">{editTaskId ? 'Edit Task' : 'Add New Task'}</h3>
                            <button onClick={() => { setShowTaskModal(false); setEditTaskId(null); }}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input required placeholder="Create the overall script" className="w-full border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                            
                            <textarea placeholder="Create the event day flow for the comperes, including the media outputs." className="w-full border border-gray-200 p-3 rounded-lg text-sm resize-none h-24 outline-none focus:border-blue-500 transition-colors" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}></textarea>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Priority</label>
                                    <select className="w-full border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-blue-500" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Deadline</label>
                                    <input required type="date" className="w-full border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-blue-500" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Open for Volunteering</h4>
                                    <p className="text-xs text-gray-500">Members across all dashboards can volunteer for this task</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newTask.is_volunteer_opportunity} onChange={e => setNewTask({ ...newTask, is_volunteer_opportunity: e.target.checked, assignedTo: [] })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {newTask.is_volunteer_opportunity && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 block">Max Volunteers Needed</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="50"
                                        value={newTask.volunteer_limit}
                                        onChange={e => setNewTask({ ...newTask, volunteer_limit: parseInt(e.target.value) || 1 })}
                                        className="w-24 border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <p className="text-xs text-gray-400">Set how many people can volunteer for this task</p>
                                </div>
                            )}

                            {!newTask.is_volunteer_opportunity && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 block">Assigned To (Student Numbers)</label>
                                    <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 rounded-lg min-h-[42px]">
                                        {Array.isArray(newTask.assignedTo) && newTask.assignedTo.map((assignee, idx) => (
                                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {assignee} 
                                                <X size={12} className="cursor-pointer" onClick={() => setNewTask({...newTask, assignedTo: newTask.assignedTo.filter(a => a !== assignee)})} />
                                            </span>
                                        ))}
                                        <div className="relative flex-1 min-w-[120px]">
                                            <input 
                                                placeholder="Type name or IM/..." 
                                                className="w-full outline-none text-sm bg-transparent" 
                                                value={taskAssignInputValue} 
                                                onChange={e => {
                                                    setTaskAssignInputValue(e.target.value);
                                                    handleSearchStudent(e.target.value);
                                                }} 
                                                onKeyDown={e => {
                                                    if(e.key === 'Enter' && taskAssignInputValue) {
                                                        e.preventDefault();
                                                        setNewTask({...newTask, assignedTo: [...newTask.assignedTo, taskAssignInputValue]});
                                                        setTaskAssignInputValue('');
                                                        setShowSuggestions(false);
                                                    }
                                                }}
                                            />
                                            {showSuggestions && suggestions.length > 0 && taskAssignInputValue.length > 2 && (
                                                <ul className="absolute z-50 w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto left-0">
                                                    {suggestions.map(s => (
                                                        <li key={s.user_id} className="p-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between" 
                                                            onClick={() => {
                                                                const sNum = s.student_number || s.student_no || '';
                                                                if (sNum && !newTask.assignedTo.includes(sNum)) {
                                                                    setNewTask({...newTask, assignedTo: [...newTask.assignedTo, sNum]});
                                                                }
                                                                setTaskAssignInputValue('');
                                                                setShowSuggestions(false);
                                                            }}>
                                                            <span className="font-semibold">{s.full_name}</span>
                                                            <span className="text-gray-500">{s.student_number || s.student_no}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 border border-gray-200 p-3 rounded-lg">
                                <input type="checkbox" id="requireSubmission" checked={newTask.proof_type === 'File_Upload'} onChange={e => setNewTask({...newTask, proof_type: e.target.checked ? 'File_Upload' : 'None'})} />
                                <label htmlFor="requireSubmission" className="text-sm font-semibold text-gray-700">Requires Submission (Proof)</label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 block">Recommended Skills</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-200 rounded-lg min-h-[42px]">
                                    {newTask.skills.map((skillId, idx) => {
                                        const skillObj = availableSkills.find(s => String(s.tag_id) === String(skillId));
                                        return (
                                            <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {skillObj ? skillObj.name : 'Unknown'} 
                                                <X size={12} className="cursor-pointer" onClick={() => setNewTask({...newTask, skills: newTask.skills.filter(s => s !== skillId)})} />
                                            </span>
                                        );
                                    })}
                                    <input 
                                        list="available-skills-list"
                                        placeholder="Type or select a skill then press Enter" 
                                        className="w-full outline-none text-sm bg-transparent flex-1"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                let found = availableSkills.find(s => s.name.toLowerCase() === val.toLowerCase());
                                                if (found) {
                                                    if (!newTask.skills.includes(found.tag_id)) {
                                                        setNewTask({...newTask, skills: [...newTask.skills, found.tag_id]});
                                                    }
                                                } else {
                                                    // Create new skill via API
                                                    try {
                                                        const res = await fetch('http://localhost:5000/api/skills', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ name: val })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            setAvailableSkills([...availableSkills, data.skill]);
                                                            setNewTask({...newTask, skills: [...newTask.skills, data.skill.tag_id]});
                                                        }
                                                    } catch (err) {}
                                                }
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <datalist id="available-skills-list">
                                        {availableSkills.map(skill => (
                                            <option key={skill.tag_id} value={skill.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white mt-4 py-3 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:bg-blue-700 transition-colors">{editTaskId ? 'Update Task' : 'Add Task'}</button>
                        </form>
                    </div>
                </div>
            )}

            {showOcModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl overflow-visible">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add OC Member</h3>
                            <button onClick={() => setShowOcModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddOC} className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Search Member</label>
                                <input 
                                    placeholder="Start typing name..." 
                                    className="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-all" 
                                    value={searchQuery} 
                                    onChange={e => handleSearchStudent(e.target.value)} 
                                />
                                {showSuggestions && suggestions.length > 0 && searchQuery.length > 2 && (
                                    <ul className="absolute z-[70] w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                        {suggestions.map(s => (
                                            <li 
                                                key={s.user_id} 
                                                className="p-3 text-sm hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0" 
                                                onClick={() => handleSelectStudent(s)}
                                            >
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{s.full_name}</span>
                                                    <span className="text-gray-500 text-xs">{s.student_no}</span>
                                                </div>
                                                <Plus size={14} className="text-blue-500" />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                                    <input 
                                        required 
                                        placeholder="Member Full Name" 
                                        className="w-full border p-2.5 rounded-lg text-sm outline-none bg-gray-50" 
                                        value={newOC.name} 
                                        onChange={e => setNewOC({ ...newOC, name: e.target.value })} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Student ID / Number</label>
                                    <input 
                                        required 
                                        placeholder="IM/202X/XXX" 
                                        className="w-full border p-2.5 rounded-lg text-sm outline-none bg-gray-50" 
                                        value={newOC.student_number} 
                                        onChange={e => setNewOC({ ...newOC, student_number: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Designation / Role</label>
                                <input list="oc-newrole-suggestions" placeholder="e.g. Finance Coordinator" className="w-full border p-2.5 rounded-lg text-sm outline-none bg-gray-50" value={newOC.role} onChange={e => setNewOC({ ...newOC, role: e.target.value })} />
                            </div>
                            <datalist id="oc-newrole-suggestions">
                                {PREDEFINED_ROLES.map(r => <option key={r} value={r} />)}
                            </datalist>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 mt-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95">Add Member to OC</button>
                        </form>
                    </div>
                </div>
            )}

            {showOverviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]">
                    <div className="bg-white p-6 rounded-xl w-[500px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Edit Event Overview</h3>
                            <button onClick={() => setShowOverviewModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleEditOverview} className="space-y-4">
                            <input required placeholder="Event Name" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={editOverviewData.event_name} onChange={e => setEditOverviewData({ ...editOverviewData, event_name: e.target.value })} />
                            <textarea placeholder="Event Description..." className="w-full border p-2 rounded text-sm h-32 resize-none outline-none focus:border-blue-500" value={editOverviewData.description} onChange={e => setEditOverviewData({ ...editOverviewData, description: e.target.value })}></textarea>
                            <input placeholder="Venue" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={editOverviewData.venue} onChange={e => setEditOverviewData({ ...editOverviewData, venue: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Start Date</label>
                                    <input type="date" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={editOverviewData.start_date} onChange={e => setEditOverviewData({ ...editOverviewData, start_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">End Date</label>
                                    <input type="date" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={editOverviewData.end_date} onChange={e => setEditOverviewData({ ...editOverviewData, end_date: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm tracking-wide shadow-sm hover:bg-blue-700 transition">Save Overview</button>
                        </form>
                    </div>
                </div>
            )}

            {showTimelineModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]">
                    <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add Timeline Stage</h3>
                            <button onClick={() => setShowTimelineModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddTimeline} className="space-y-4">
                            <input required placeholder="Stage/Phase Name (e.g. Media Preparation)" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={newTimeline.title} onChange={e => setNewTimeline({ ...newTimeline, title: e.target.value })} />
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Scheduled Date</label>
                                <input required type="date" className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={newTimeline.date} onChange={e => setNewTimeline({ ...newTimeline, date: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm tracking-wide shadow-sm hover:bg-blue-700 transition">Add Stage</button>
                        </form>
                    </div>
                </div>
            )}

            <EditEventModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                event={event}
                onSuccess={handleEditSuccess}
            />

            {/* DISCUSSION MODAL */}
            {showDiscussionTask && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MessageIcon size={20} className="text-indigo-600" />
                                    Task Discussion
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Topic: <span className="text-indigo-600 font-bold">{showDiscussionTask.title}</span></p>
                            </div>
                            <button 
                                onClick={() => setShowDiscussionTask(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <CommentsThread 
                                assignmentId={showDiscussionTask.assignment_id}
                                currentUserRole={user?.role || user?.user_type}
                                isAssignee={user?.id === showDiscussionTask.assigned_user_id}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UnifiedEventDetails;
