import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, FileText, Clock,
    ChevronRight, Users, Calendar, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';

const MemberDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    // Fetch live events from DB
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/events');
                if (res.ok) setEvents(await res.json());
            } catch (err) {
                console.error('Events fetch error', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    // Placeholder until task APIs exist — empty, no dummy data
    const myTasks = [];
    const volunteerOps = [];
    const notifications = [];

    const handleApply = (task) => {
        alert(`Successfully applied for: ${task.title}`);
        setSelectedVolunteerTask(null);
    };

    const ScrollSection = ({ id, title, children }) => (
        <div id={id} className="mb-8 scroll-mt-24">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <button className="text-teal-600 text-xs font-semibold hover:underline">View All</button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                {children}
            </div>
        </div>
    );

    return (
        <div className="pb-10 relative">

            {/* HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative">
                    {/* NOTIFICATION BELL */}
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
                            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50 animate-fade-in-down">
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                                    <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowNotifications(false)} />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-xs">No new notifications</div>
                                    ) : notifications.map(n => (
                                        <div key={n.id} className="p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer">
                                            <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                                            <p className="text-[10px] text-gray-500">{n.msg}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* HOME ICON */}
                    <Home
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    />
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Member</div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                        {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'M'}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* PAGE HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Member Dashboard</h2>
                    <button
                        onClick={() => navigate('/member/request-letter')}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                    >
                        <FileText size={16} /> Request Letter
                    </button>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-5 w-full">
                        <div
                            onClick={() => navigate('/member/profile')}
                            className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-3xl cursor-pointer hover:bg-teal-200 transition-colors"
                        >
                            {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'M'}
                        </div>
                        <div>
                            <h3
                                onClick={() => navigate('/member/profile')}
                                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-teal-600 transition-colors"
                            >
                                {user?.full_name || user?.name || 'Member'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">
                                {user?.student_no || ''}{user?.student_no ? ' • ' : ''}{user?.role_name || 'Member'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/member/feedback')}
                        className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Feedback
                    </button>
                </div>

                {/* MY TASKS */}
                <ScrollSection id="tasks" title="My Tasks">
                    {myTasks.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks assigned yet.
                        </div>
                    ) : myTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => navigate(`/member/tasks/${task.id}`)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2 flex-grow">{task.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {task.due}</div>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Event: {task.event}</span>
                        </div>
                    ))}
                </ScrollSection>

                {/* VOLUNTEER OPPORTUNITIES */}
                <ScrollSection id="volunteer" title="Volunteer Opportunities">
                    {volunteerOps.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No volunteer opportunities at this time.
                        </div>
                    ) : volunteerOps.map(op => (
                        <div
                            key={op.id}
                            onClick={() => setSelectedVolunteerTask(op)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{op.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">{op.desc}</p>
                            <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center text-gray-500 group-hover:text-teal-600">
                                <span className="text-xs font-medium">Click to View</span>
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* EVENTS (Live from DB) */}
                <ScrollSection id="events" title="Events">
                    {loadingEvents ? (
                        <div className="w-full min-w-[300px] text-center py-10 text-gray-400 snap-start">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">No events found.</div>
                    ) : events.map(event => (
                        <div
                            key={event.event_id}
                            onClick={() => navigate(`/events/${event.event_id}`)}
                            className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {event.event_name?.substring(0, 2).toUpperCase() || 'EV'}
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm">{event.event_name}</h4>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Total Tasks</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        </div>
                    ))}
                </ScrollSection>
            </div>

            <VolunteerTaskModal
                isOpen={!!selectedVolunteerTask}
                task={selectedVolunteerTask}
                onClose={() => setSelectedVolunteerTask(null)}
                onApply={handleApply}
            />
        </div>
    );
};

export default MemberDashboard;