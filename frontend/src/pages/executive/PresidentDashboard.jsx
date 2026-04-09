import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, FileText,
    Bell, Clock, ChevronRight, Home, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';
import UserDropdown from '../../components/UserDropdown';

const PresidentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [tasksToApprove, setTasksToApprove] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [volunteerOps, setVolunteerOps] = useState([]);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            const uid = user?.id;
            if (!uid) return;
            
            try {
                // Fetch Events
                const resEvents = await fetch('http://localhost:5000/api/events');
                if (resEvents.ok) setEvents(await resEvents.json());

                // Fetch My Tasks
                const resMyTasks = await fetch(`http://localhost:5000/api/events/my-tasks?user_id=${uid}`);
                if (resMyTasks.ok) setMyTasks(await resMyTasks.json());

                // Fetch Volunteer Opportunities (exclude own events)
                const resVolOps = await fetch(`http://localhost:5000/api/events/volunteer-opportunities?exclude_user_id=${uid}&current_user_id=${uid}`);
                if (resVolOps.ok) {
                    const data = await resVolOps.json();
                    // Filter out full tasks and tasks user already volunteered for
                    const availableTasks = data.filter(task => !task.is_full && !task.user_has_volunteered);
                    setVolunteerOps(availableTasks);
                }

                // Fetch Tasks to Approve (scoped to Exec - system wide)
                const resApprove = await fetch(`http://localhost:5000/api/events/tasks-to-approve?user_id=${uid}&role=exec`);
                if (resApprove.ok) setTasksToApprove(await resApprove.json());
                
            } catch (err) {
                console.error('Data fetch error', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchData();
    }, [user]);

    const handleApplyVolunteer = async (task) => {
        try {
            const uid = user?.id;
            const res = await fetch(`http://localhost:5000/api/events/tasks/${task.id}/volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: uid })
            });
            const data = await res.json();
            alert(res.ok ? `Volunteered for: ${task.title}!` : data.message);
            
            if (res.ok) {
                alert(`Volunteered for: ${task.title}!`);
                setVolunteerOps(prev => prev.filter(op => op.id !== task.id));
                setMyTasks(prev => [...prev, { ...task, status: 'Assigned' }]);
                
                // Emit event to refresh EventDetails page
                window.dispatchEvent(new CustomEvent('taskAssigned', { 
                    detail: { taskId: task.id, eventId: task.event_id } 
                }));
            }
        } catch (err) {
            alert('Failed to volunteer. Try again.');
        }
        setSelectedVolunteerTask(null);
    };

    const handleApproveTask = async (task) => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/tasks/${task.id}/assignments/${task.assignment_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Approved' })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Approved task: ${task.title}`);
                setTasksToApprove(prev => prev.filter(t => t.assignment_id !== task.assignment_id));
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to approve task.');
        }
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
        <div className="pb-10 bg-gray-50 min-h-screen font-sans">

            {/* HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Bell size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                    </div>
                    <Home size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">President</div>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* BACK ARROW & GREETING (inline) + ACTION BUTTONS */}
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/exec/create-event')}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all text-xs"
                        >
                            <Calendar size={16} /> Create Event
                        </button>
                        <button
                            onClick={() => navigate('/member/request-letter')}
                            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all text-xs"
                        >
                            <FileText size={16} /> Request Letter
                        </button>
                    </div>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-5 w-full">
                        <div
                            onClick={() => navigate('/member/profile')}
                            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-3xl cursor-pointer hover:bg-emerald-200 transition-colors"
                        >
                            {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{user?.full_name || user?.name || 'President'}</h3>
                            <p className="text-sm text-gray-500 mb-2">{user?.student_no || ''} • President</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/member/feedback')} className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                        Feedback
                    </button>
                </div>

                <ScrollSection id="approve-tasks" title="Tasks to Approve">
                    {tasksToApprove.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks requiring approval.
                        </div>
                    ) : tasksToApprove.map(task => (
                        <div key={task.assignment_id} className="min-w-[350px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between snap-start">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm">{task.title}</h4>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${task.assignment_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {task.assignment_status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.desc}</p>
                                <div className="text-xs text-gray-500 mb-2"><strong>Event:</strong> {task.event}</div>
                                <div className="text-xs text-gray-500 mb-4"><strong>By:</strong> {task.assigned_to}</div>
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-50">
                                <button 
                                    onClick={() => handleApproveTask(task)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                <ScrollSection id="my-tasks" title="My Tasks">
                    {myTasks.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks assigned.
                        </div>
                    ) : myTasks.map(task => (
                        <div key={task.id} onClick={() => navigate(`/exec/tasks/${task.id}/${task.assignment_id}`)} className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col snap-start group">
                            <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{task.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {task.due}</div>
                            <div className="flex justify-between items-center">
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Event: {task.event}</span>
                                <span className="text-[10px] text-gray-400 font-semibold">{task.status}</span>
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* VOLUNTEER OPPORTUNITIES */}
                <ScrollSection id="volunteer-opportunities" title="Volunteer Opportunities">
                    {volunteerOps.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No volunteer opportunities at this time.
                        </div>
                    ) : volunteerOps.map(op => (
                        <div key={op.id} onClick={() => setSelectedVolunteerTask(op)} className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group">
                            <h4 className="font-bold text-gray-800 text-sm mb-2 group-hover:text-teal-600 transition-colors">{op.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">{op.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {op.due}</div>
                            <div className="mb-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${op.color}`}>Event: {op.event}</span></div>
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
                        <div key={event.event_id} onClick={() => navigate(`/events/${event.event_id}`)} className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {event.event_name?.substring(0, 2).toUpperCase() || 'EV'}
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm">{event.event_name}</h4>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Tasks</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* TERM MANAGEMENT (President only) */}
                <div id="term-management" className="space-y-4 mb-8 scroll-mt-24">
                    <h3 className="text-lg font-bold text-gray-900">Term Management</h3>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-end">
                        <div>
                            <h4 className="text-md font-bold text-gray-800">Current Term</h4>
                            <p className="text-2xl font-bold text-gray-900 mt-1">2024/2025</p>
                        </div>
                        <button
                            onClick={() => navigate('/exec/nominate-term')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                        >
                            Assign Next Term
                        </button>
                    </div>
                </div>

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

export default PresidentDashboard;
