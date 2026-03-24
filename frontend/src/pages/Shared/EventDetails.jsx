import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import EditEventModal from '../../components/EditEventModal';
import { useAuth } from '../../context/AuthContext';

const EventDetails = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [activeTab, setActiveTab] = useState('Overview');
    
    const { user } = useAuth();
    // --- SERVER STATE ---
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isExecutive = user?.hierarchy_level >= 4 || user?.user_type === 'Executive' || user?.role_name === 'Junior Treasurer' || user?.role_name === 'Junior_Treasurer';
    const isPresident = user?.role_name === 'President';

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this event? All tasks and timelines will also be removed. This cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Event deleted successfully!");
                navigate(-1);
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.message}`);
            }
        } catch (err) {
            alert("Network error. Please try again.");
        }
    };

    const handleEditSuccess = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/${eventId}/details`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) { }
    };

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/events/${eventId}/details`);
                if (res.ok) {
                    setData(await res.json());
                } else {
                    console.error("Failed to load event details");
                }
            } catch (err) {
                console.error("Error fetching event details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId]);

    if (loading) {
        return <div className="p-8 max-w-7xl mx-auto flex justify-center items-center h-48"><p className="text-gray-500 font-medium animate-pulse">Loading Event Details...</p></div>;
    }

    if (!data || !data.event) {
        return <div className="p-8 max-w-7xl mx-auto text-center mt-10"><h2 className="text-xl font-bold text-gray-800">Event Not Found</h2><button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline flex items-center justify-center gap-2"><ArrowLeft size={16}/> Go Back</button></div>;
    }

    const { event, tasks, committee, timeline } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto mb-20 font-sans">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-4 hover:underline">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>{new Date(event.start_date).toLocaleDateString()} - {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBD'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 sm:mt-0">
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

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
                {['Overview', 'Tasks', 'OC', 'Timeline'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- TAB 1: OVERVIEW --- */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase">Event Description</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-8">
                            {event.description || 'No detailed description provided for this event.'}
                        </p>
                    </div>
                    <div>
                        <div className="rounded-xl shadow-sm bg-blue-50 object-cover w-full h-80 flex justify-center items-center">
                            <h2 className="text-blue-200 font-bold text-4xl">{event.event_name?.substring(0, 2).toUpperCase()}</h2>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 2: TASKS --- */}
            {activeTab === 'Tasks' && (
                <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-gray-900 mb-6">Task Summary</h3>
                    {tasks.length === 0 ? (
                        <div className="p-10 text-center bg-gray-50 rounded-xl border border-gray-100"><p className="text-gray-500">No tasks have been assigned for this event.</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                                        <th className="py-3 font-medium">Task</th>
                                        <th className="py-3 font-medium">Assigned To</th>
                                        <th className="py-3 font-medium">Deadline</th>
                                        <th className="py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {tasks.map((task) => (
                                        <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="py-4 font-bold text-gray-800">{task.title}</td>
                                            <td className="py-4 text-gray-500">{task.assignedTo || 'Unassigned'}</td>
                                            <td className="py-4 text-gray-500">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}</td>
                                            <td className="py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    task.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {task.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB 3: OC --- */}
            {activeTab === 'OC' && (
                <div className="animate-fade-in">
                    <h3 className="text-base font-bold text-gray-900 mb-6">Event Organizing Committee</h3>
                    {committee.length === 0 ? (
                        <div className="p-10 text-center bg-gray-50 rounded-xl border border-gray-100"><p className="text-gray-500">No committee members found.</p></div>
                    ) : (
                        <div className="bg-white rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr className="text-xs text-gray-400">
                                        <th className="py-3 px-4 font-medium">Name</th>
                                        <th className="py-3 px-4 font-medium">Student ID</th>
                                        <th className="py-3 px-4 font-medium">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {committee.map((member) => (
                                        <tr key={member.eo_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-4 px-4 font-bold text-gray-900">{member.name}</td>
                                            <td className="py-4 px-4 text-gray-500">{member.id}</td>
                                            <td className="py-4 px-4 text-gray-500">{member.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB 4: TIMELINE --- */}
            {activeTab === 'Timeline' && (
                <div className="animate-fade-in pt-4">
                    <h3 className="text-base font-bold text-gray-900 mb-8">Event Timeline</h3>
                    {timeline.length === 0 ? (
                        <div className="p-10 text-center bg-gray-50 rounded-xl border border-gray-100"><p className="text-gray-500">Timeline has not been set yet.</p></div>
                    ) : (
                        <div className="relative pl-6 space-y-8 border-l-2 border-teal-100 ml-3">
                            {timeline.map((item, index) => (
                                <div key={item.id} className="relative">
                                    {/* Dot */}
                                    <div className={`absolute -left-[31px] top-1 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                                        {item.description && <p className="text-xs text-gray-500 mt-1 mb-2">{item.description}</p>}
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <Clock size={12} />
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

export default EventDetails;