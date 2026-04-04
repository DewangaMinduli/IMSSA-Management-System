import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Edit, Edit2, Clock, Users, Plus, X, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import EditEventModal from '../../components/EditEventModal';
import { useAuth } from '../../context/AuthContext';
import { Bell, Home } from 'lucide-react';
import UserDropdown from '../../components/UserDropdown';
const OCEventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const notifications = [];

    const [activeTab, setActiveTab] = useState('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'High', deadline: '', assignedTo: '', is_volunteer_opportunity: false });

    const [showOcModal, setShowOcModal] = useState(false);
    const [newOC, setNewOC] = useState({ name: '', student_number: '', role: 'Organizing Committee Member' });
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // PARTNERSHIPS STATE
    const [partnerships, setPartnerships] = useState([]);
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

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tasks/event/${eventId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newTask)
            });
            if (res.ok) {
                setShowTaskModal(false);
                setNewTask({ title: '', description: '', priority: 'High', deadline: '', assignedTo: '', is_volunteer_opportunity: false });
                fetchEventDetails();
            }
        } catch (err) {
            console.error('Error adding task', err);
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
                fetchEventDetails();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveRole = async (eoId) => {
        try {
            const token = localStorage.getItem('token');
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
            }
        } catch (err) {
            console.error(err);
        }
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

    const isExecutive = user?.hierarchy_level >= 4 || user?.user_type === 'Executive' || user?.role_name === 'Junior Treasurer' || user?.role_name === 'Junior_Treasurer';
    const isPresident = user?.role_name === 'President';

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
            if (res.ok) setData(await res.json());
        } catch (err) { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const handleSaveRole = async (memberId) => {
        setEditingOcId(null);
        // Backend Hook to be appended
    };

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

    const { event, tasks, committee: ocMembers, timeline } = data;

    // TAB RENDER FUNCTIONS
    const renderOverview = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Event Description</h3>
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
                    className="text-blue-600 font-medium text-sm hover:underline flex items-center gap-2"
                >
                    <Edit2 size={16} /> Edit Overview
                </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <p className="text-gray-700 text-sm mb-6 leading-relaxed whitespace-pre-wrap">{event.description || 'No specific description provided.'}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 border-t border-gray-200 pt-4">
                    <div>
                        <span className="font-bold text-gray-500 block mb-1">Venue</span>
                        <span className="text-gray-900">{event.venue || 'TBA'}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTasks = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Task Summary</h3>
                <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add Task
                </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">Task</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Deadline</th>
                            <th className="px-6 py-4">Type</th>
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
                                <td className="px-6 py-4 text-gray-500 font-medium italic">{task.assignedTo || 'Unassigned'}</td>
                                <td className="px-6 py-4 text-gray-500">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.is_volunteer_opportunity ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.is_volunteer_opportunity ? 'Volunteer' : 'Assigned'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.is_volunteer_opportunity ? (
                                        <span className="text-gray-400 italic text-xs">No assignee</span>
                                    ) : (
                                        <select 
                                            className="border border-gray-200 rounded px-2 py-1 text-xs outline-none text-gray-700" 
                                            value={task.assignment_status || 'Pending'}
                                            onChange={(e) => console.log('Update Status API needed', e.target.value)}
                                        >
                                            <option value="Volunteer">Volunteer</option>
                                            <option value="Assigned">Assigned</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Declined">Declined</option>
                                        </select>
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
                <button onClick={() => setShowOcModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add OC
                </button>
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
                                <td className="px-6 py-4 text-gray-500">{member.student_id || member.id}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {editingOcId === member.eo_id ? (
                                        <select
                                            className="w-full border border-gray-300 p-1.5 rounded-md text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={editRoleStr}
                                            onChange={(e) => setEditRoleStr(e.target.value)}
                                        >
                                            {PREDEFINED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    ) : (
                                        member.role
                                    )}
                                </td>
                                <td className="px-6 py-4 flex gap-3 h-full items-center">
                                    {editingOcId === member.eo_id ? (
                                        <>
                                            <button onClick={() => handleSaveRole(member.eo_id)} className="text-green-600 font-medium text-xs hover:underline flex items-center gap-1"><CheckCircle size={12} /> Save</button>
                                            <button onClick={() => setEditingOcId(null)} className="text-gray-500 font-medium text-xs hover:underline flex items-center gap-1"><X size={12} /> Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingOcId(member.eo_id); setEditRoleStr(member.role); }} className="text-blue-600 font-medium text-xs hover:underline flex items-center gap-1"><Edit size={12} /> Edit Role</button>
                                        </>
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

    const handleAddPartner = (e) => {
        e.preventDefault();
        if (editingId) {
            setPartnerships(prev => prev.map(p => p.partnership_id === editingId ? { ...p, ...newPartner } : p));
            setEditingId(null);
        } else {
            setPartnerships([...partnerships, { ...newPartner, partnership_id: Date.now() }]);
        }
        setShowPartnerModal(false);
        setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Pending' });
    };

    const handleEditPartner = (partner) => {
        setNewPartner(partner);
        setEditingId(partner.partnership_id);
        setShowPartnerModal(true);
    };

    const renderPartnerships = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Request Letters / Partnerships</h3>
                <button onClick={() => { setEditingId(null); setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Paid' }); setShowPartnerModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add Partner
                </button>
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
                        {partnerships.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400 italic">
                                    No partnerships added yet.
                                </td>
                            </tr>
                        ) : (
                            partnerships.map(p => (
                                <tr key={p.partnership_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{p.company_name}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.contact_person}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.package_type}</td>
                                    <td className="px-6 py-4 text-green-700 font-semibold">{p.amount_promised}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEditPartner(p)} className="text-blue-600 font-medium text-xs hover:underline flex items-center gap-1"><Edit2 size={12}/> Edit</button>
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
                                <select className="w-full border p-2 rounded text-sm" value={newPartner.package_type} onChange={e => setNewPartner({ ...newPartner, package_type: e.target.value })}>
                                    <option>Monetary</option>
                                    <option>Beverage</option>
                                    <option>Gift Partner</option>
                                    <option>Other</option>
                                </select>
                                <input placeholder="Amount Promised (if any)" className="w-full border p-2 rounded text-sm" type="number" value={newPartner.amount_promised} onChange={e => setNewPartner({ ...newPartner, amount_promised: e.target.value })} />
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
            <h3 className="text-lg font-bold text-gray-800 mb-6">Event Timeline</h3>
            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                {timeline.map((item, index) => (
                    <div key={item.id} className="ml-8 relative">
                        <span className="absolute -left-[41px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-teal-500">
                            {index + 1}
                        </span>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock size={12} /> {new Date(item.date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans relative">
            {/* HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative">
                    <div className="relative">
                        <Bell
                            size={20}
                            className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                            onClick={() => setShowNotifications(!showNotifications)}
                        />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                        {showNotifications && (
                            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50">
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                                    <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowNotifications(false)} />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <div className="p-4 text-center text-gray-500 text-xs">No new notifications</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Home size={20} className="text-gray-500 cursor-pointer hover:text-teal-600 transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">Organizing Committee</div>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

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
                        {isExecutive && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                <Edit2 size={16} /> Edit Event
                            </button>
                        )}
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
                        {['Overview', 'Tasks', 'OC', 'Timeline', 'Partnerships'].map(tab => (
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
                            <h3 className="font-bold text-xl text-gray-900">Add New Task</h3>
                            <button onClick={() => setShowTaskModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
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
                                    <input type="checkbox" className="sr-only peer" checked={newTask.is_volunteer_opportunity} onChange={e => setNewTask({ ...newTask, is_volunteer_opportunity: e.target.checked, assignedTo: '' })} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {!newTask.is_volunteer_opportunity && (
                                <input placeholder="IM/2023/025" className="w-full border border-gray-200 p-3 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors" value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })} />
                            )}

                            <button type="submit" className="w-full bg-blue-600 text-white mt-4 py-3 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:bg-blue-700 transition-colors">Add Task</button>
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
                                <input 
                                    required 
                                    placeholder="Search by Name or IM/..." 
                                    className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" 
                                    value={searchQuery} 
                                    onChange={e => handleSearchStudent(e.target.value)} 
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                        {suggestions.map(s => (
                                            <li key={s.user_id} className="p-2 text-sm hover:bg-gray-100 cursor-pointer flex justify-between" onClick={() => handleSelectStudent(s)}>
                                                <span className="font-semibold">{s.full_name}</span>
                                                <span className="text-gray-500">{s.student_no}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {newOC.name && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 border border-gray-100 rounded">
                                    <div><span className="font-medium">Selected:</span> {newOC.name}</div>
                                    <div><span className="font-medium">ID:</span> {newOC.student_number}</div>
                                </div>
                            )}
                            <select className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" value={newOC.role} onChange={e => setNewOC({ ...newOC, role: e.target.value })}>
                                {PREDEFINED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 transition">Add Member</button>
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

        </div>
    );
};

export default OCEventDetails;
