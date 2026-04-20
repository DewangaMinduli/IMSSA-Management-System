import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, FileText, Clock,
    ChevronRight, Users, Calendar, X, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';
import UserDropdown from '../../components/UserDropdown';

const MemberDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const notify = useNotify();
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

    const notifications = [];
    const [volunteerOps, setVolunteerOps] = useState([]);
    const [myTasks, setMyTasks] = useState([]);

    // Fetch live data
    useEffect(() => {
        if (!user?.id) return;
        const uid = user.id;

        // Fetch Volunteer Opportunities
        fetch(`http://localhost:5000/api/events/volunteer-opportunities?current_user_id=${uid}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                // Filter out full tasks and tasks user already volunteered for
                const availableTasks = data.filter(task => !task.is_full && !task.user_has_volunteered);
                setVolunteerOps(availableTasks);
            })
            .catch(() => {});

        // Fetch My Tasks
        fetch(`http://localhost:5000/api/events/my-tasks?user_id=${uid}`)
            .then(r => r.ok ? r.json() : [])
            .then(setMyTasks)
            .catch(() => {});
    }, [user]);

    const handleApply = async (task) => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/tasks/${task.id}/volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id || user?.user_id })
            });
            const data = await res.json();
            
            if (res.ok) {
                notify(`Volunteered for: ${task.title}!`, 'success');
                setVolunteerOps(prev => prev.filter(op => op.id !== task.id));
                setMyTasks(prev => [...prev, { ...task, status: 'Assigned' }]);
                
                // Emit event to refresh EventDetails page
                window.dispatchEvent(new CustomEvent('taskAssigned', { 
                    detail: { taskId: task.id, eventId: task.event_id } 
                }));
            } else {
                notify(data.message || 'Failed to volunteer.', 'error');
            }
        } catch (err) {
            notify('Failed to volunteer. Try again.', 'error');
        }
        setSelectedVolunteerTask(null);
    };

    const ScrollSection = ({ id, title, children }) => (
        <div id={id} className="mb-8 scroll-mt-24">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <button className="text-teal-600 text-xs font-semibold hover:underline">View All</button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                {children}
            </div>
        </div>
    );

    return (
        <div className="pb-10 relative px-8 mt-10">
            <div className="max-w-7xl mx-auto">

                {/* BACK ARROW + GREETING + REQUEST LETTER */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <ArrowRight
                            className="transform rotate-180 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors flex-shrink-0"
                            size={22}
                            onClick={() => window.history.back()}
                        />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                Hi, {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'} 👋
                            </p>
                            <p className="text-sm text-gray-400 mt-0.5">Welcome back.</p>
                        </div>
                    </div>
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
                            onClick={() => navigate(`/member/tasks/${task.id}/${task.assignment_id}`)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2 flex-grow">{task.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {task.due}</div>
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">Event: {task.event}</span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    task.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                    task.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' :
                                    task.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {task.status === 'Verified' ? 'Completed' : 
                                     task.status === 'Rejected' ? 'Needs Revision' : 
                                     task.status === 'Submitted' ? 'Review Pending' : 
                                     task.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* VOLUNTEER OPPORTUNITIES */}
                <ScrollSection id="volunteer" title="Volunteer Opportunities">
                    {volunteerOps.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No volunteer opportunities at this time.
                        </div>
                    ) : volunteerOps.map(op => {
                        const isFull = op.is_full === true;
                        const volunteerCount = op.volunteer_count || 0;
                        const maxVolunteers = op.max_volunteers || 5;
                        
                        return (
                            <div
                                key={op.id}
                                onClick={() => setSelectedVolunteerTask(op)}
                                className={`min-w-[320px] bg-white p-5 rounded-xl border flex flex-col hover:shadow-md transition-all snap-start cursor-pointer group ${
                                    isFull ? 'border-gray-200 opacity-75' : 'border-gray-100 shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-teal-600 transition-colors flex-1">{op.title}</h4>
                                    {isFull && (
                                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded whitespace-nowrap">Full</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">{op.desc}</p>
                                
                                {/* Volunteer Counter */}
                                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-medium text-gray-600">Volunteers</span>
                                        <span className={`text-xs font-bold ${isFull ? 'text-red-600' : 'text-teal-600'}`}>
                                            {volunteerCount} of {maxVolunteers}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all ${isFull ? 'bg-red-500' : 'bg-teal-500'}`}
                                            style={{ width: `${(volunteerCount / maxVolunteers) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center text-gray-500 group-hover:text-teal-600">
                                    <span className="text-xs font-medium">Click to View</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        );
                    })}
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