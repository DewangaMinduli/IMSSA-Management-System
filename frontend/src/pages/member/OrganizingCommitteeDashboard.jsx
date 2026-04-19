import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, FileText, Clock,
    ChevronRight, Users, Calendar, X, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import UserDropdown from '../../components/UserDropdown';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';

const OrganizingCommitteeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const notify = useNotify();
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Data states
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [volunteerOps, setVolunteerOps] = useState([]);
    const [tasksToApprove, setTasksToApprove] = useState([]);
    
    // Modal states
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            const uid = user?.id;
            console.log('[OC Dashboard] User ID:', uid, 'User object:', user);
            if (!uid) {
                console.error('[OC Dashboard] No user ID found');
                return;
            }
            
            try {
                // Fetch Events
                const resMyEvents = await fetch(`http://localhost:5000/api/events?user_id=${uid}`);
                console.log('[OC Dashboard] Events API status:', resMyEvents.status, resMyEvents.ok);
                if (resMyEvents.ok) {
                    const eventsData = await resMyEvents.json();
                    console.log('[OC Dashboard] Events data:', eventsData);
                    setEvents(eventsData);
                } else {
                    const errorText = await resMyEvents.text();
                    console.error('[OC Dashboard] Events API error:', errorText);
                }

                const resAllEvents = await fetch('http://localhost:5000/api/events');
                if (resAllEvents.ok) {
                    const allEventsData = await resAllEvents.json();
                    console.log('[OC Dashboard] All events data:', allEventsData);
                    setAllEvents(allEventsData);
                }

                // Fetch My Tasks
                const resMyTasks = await fetch(`http://localhost:5000/api/events/my-tasks?user_id=${uid}`);
                console.log('[OC Dashboard] My Tasks API status:', resMyTasks.status, resMyTasks.ok);
                if (resMyTasks.ok) {
                    const tasksData = await resMyTasks.json();
                    console.log('[OC Dashboard] My Tasks data:', tasksData);
                    setMyTasks(tasksData);
                } else {
                    const errorText = await resMyTasks.text();
                    console.error('[OC Dashboard] My Tasks API error:', errorText);
                }

                // Fetch Volunteer Opportunities (exclude own events)
                const resVolOps = await fetch(`http://localhost:5000/api/events/volunteer-opportunities?exclude_user_id=${uid}&current_user_id=${uid}`);
                if (resVolOps.ok) {
                    const data = await resVolOps.json();
                    console.log('[OC Dashboard] Volunteer ops data:', data);
                    // Filter out full tasks and tasks user already volunteered for
                    const availableTasks = data.filter(task => !task.is_full && !task.user_has_volunteered);
                    setVolunteerOps(availableTasks);
                }

                // Fetch Tasks to Approve (scoped to OC)
                const resApprove = await fetch(`http://localhost:5000/api/events/tasks-to-approve?user_id=${uid}&role=oc`);
                console.log('[OC Dashboard] Tasks to approve API status:', resApprove.status, resApprove.ok);
                if (resApprove.ok) {
                    const approveData = await resApprove.json();
                    console.log('[OC Dashboard] Tasks to approve data:', approveData);
                    setTasksToApprove(approveData);
                } else {
                    const errorText = await resApprove.text();
                    console.error('[OC Dashboard] Tasks to approve API error:', errorText);
                }
                
            } catch (err) {
                console.error('[OC Dashboard] Data fetch error:', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchData();

        // Listen for task approval from TaskDetails page and refresh
        window.addEventListener('taskApproved', fetchData);
        return () => window.removeEventListener('taskApproved', fetchData);
    }, [user]);

    const otherEvents = allEvents.filter(e => !events.find(me => me.event_id === e.event_id));
    const notifications = []; // Pending Phase 2

    // Apply for volunteer opportunity
    const handleApplyVolunteer = async (task) => {
        try {
            const uid = user?.id;
            const res = await fetch(`http://localhost:5000/api/events/tasks/${task.id}/volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: uid })
            });
            const data = await res.json();
            
            // Remove from list immediately
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

    // Approve task submission


    // Reusable Horizontal Scroll Section Component
    const ScrollSection = ({ id, title, children }) => (
        <div id={id} className="mb-10 scroll-mt-24">
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
        <div className="pb-10 bg-gray-50 min-h-screen font-sans px-8 mt-10">
            <div className="max-w-7xl mx-auto">
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <FileText size={16} /> Request Letter
                    </button>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-center mb-10">
                    <div className="flex items-center gap-5">
                        <div
                            onClick={() => navigate('/member/profile')}
                            className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-2xl cursor-pointer hover:bg-teal-200 transition-colors"
                        >
                            {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{user?.full_name || user?.name || 'OC Member'}</h3>
                            <p className="text-xs text-gray-500 mb-2">{user?.student_no || ''}{user?.student_no ? ' • ' : ''}Organizing Committee</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/member/feedback')}
                        className="bg-teal-100 text-teal-700 px-4 py-1.5 rounded-md text-xs font-bold hover:bg-teal-200 transition-colors"
                    >
                        Feedback
                    </button>
                </div>

                {/* MY EVENTS */}
                <ScrollSection id="my-events" title="My Events">
                    {loadingEvents ? (
                        <div className="w-full min-w-[300px] text-center py-10 text-gray-400 snap-start">Loading events...</div>
                    ) : events.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">No events found.</div>
                    ) : (
                        events.map(event => (
                            <div
                                key={event.event_id}
                                onClick={() => navigate(`/member/event/${event.event_id}`)}
                                className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {event.event_name?.substring(0, 2).toUpperCase() || 'EV'}
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm">{event.event_name}</h4>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                    <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                    <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Tasks</span></div>
                                </div>
                                <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold cursor-pointer hover:text-blue-700">
                                    <span>View Details</span><ArrowRight size={14} />
                                </div>
                            </div>
                        )
                    ))}
                </ScrollSection>

                {/* TASKS TO APPROVE */}
                <ScrollSection id="tasks-to-approve" title="Tasks to Approve">
                    {tasksToApprove.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks pending approval.
                        </div>
                    ) : (
                        tasksToApprove.map(task => (
                            <div 
                                key={task.assignment_id} 
                                onClick={() => navigate(`/member/tasks/${task.id}/${task.assignment_id}`)}
                                className="min-w-[350px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between snap-start cursor-pointer hover:shadow-md transition-all group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{task.title}</h4>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${task.assignment_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {task.assignment_status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.desc}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <div className="text-xs text-gray-500"><strong>Event:</strong> {task.event}</div>
                                        <div className="text-xs text-gray-500"><strong>By:</strong> {task.assigned_to}</div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-3 border-t border-gray-50">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/member/tasks/${task.id}/${task.assignment_id}?mode=review`);
                                        }}
                                        className="bg-slate-700 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                                    >
                                        Assess Submission
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </ScrollSection>

                {/* MY TASKS */}
                <ScrollSection id="tasks" title="My Tasks">
                    {myTasks.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks assigned yet.
                        </div>
                    ) : (
                        myTasks.map(task => (
                            <div key={task.id} onClick={() => navigate(`/member/tasks/${task.id}/${task.assignment_id}`)} className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer group snap-start">
                                <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{task.title}</h4>
                                <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2 flex-grow">{task.desc}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {task.due}</div>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-teal-700">Event: {task.event}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        task.status === 'Verified' ? 'bg-teal-100 text-teal-800' :
                                        task.status === 'Rejected' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                                        task.status === 'Submitted' ? 'bg-blue-50 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {task.status === 'Verified' ? 'Completed' : 
                                         task.status === 'Rejected' ? 'Needs Revision' : 
                                         task.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
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
                                className={`min-w-[320px] bg-white p-5 rounded-xl border flex flex-col hover:shadow-md transition-all snap-start cursor-pointer group ${isFull ? 'border-gray-200 opacity-75' : 'border-gray-100 shadow-sm'}`}
                            >
                                <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{op.title}</h4>
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

                {/* OTHER EVENTS */}
                <ScrollSection id="events" title="Events">
                    {otherEvents.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No other ongoing events.
                        </div>
                    ) : (
                        otherEvents.map(event => (
                            <div
                                key={event.event_id}
                                onClick={() => navigate(`/events/${event.event_id}`)}
                                className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start group"
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
                        ))
                    )}
                </ScrollSection>

            </div>
            
            <VolunteerTaskModal
                isOpen={!!selectedVolunteerTask}
                task={selectedVolunteerTask}
                onClose={() => setSelectedVolunteerTask(null)}
                onApply={handleApplyVolunteer}
            />
        </div>
    );
};

export default OrganizingCommitteeDashboard;