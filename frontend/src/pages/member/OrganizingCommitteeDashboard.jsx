import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, FileText, Clock,
    ChevronRight, Users, Calendar, X, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from '../../components/UserDropdown';

const OrganizingCommitteeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    // Fetch live events from DB
    useEffect(() => {
        const fetchEvents = async () => {
            if (!user?.id) return;
            try {
                const resMy = await fetch(`http://localhost:5000/api/events?user_id=${user.id}`);
                const resAll = await fetch('http://localhost:5000/api/events');
                
                if (resMy.ok) setEvents(await resMy.json());
                if (resAll.ok) setAllEvents(await resAll.json());
            } catch (err) {
                console.error('Events fetch error', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, [user?.id]);

    const otherEvents = allEvents.filter(e => !events.find(me => me.event_id === e.event_id));

    // Placeholder until OC-specific task APIs exist
    const myTasks = [];
    const tasksToApprove = [];
    const notifications = [];

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
                    {/* EVENT JUMP LINKS */}
                    <div className="flex items-center gap-1.5 mr-2 border-r border-gray-200 pr-4">
                        <div 
                            onClick={() => document.getElementById('my-events')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2"
                        >
                            <Calendar size={14} /> My Events
                        </div>
                    </div>
                    
                    <Home size={20} className="text-gray-500 cursor-pointer hover:text-teal-600 transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">Organizing Committee</div>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* PAGE TITLE & ACTION */}
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

                {/* MY EVENTS (Live events from DB) */}
                <h3 id="my-events" className="text-lg font-bold text-gray-900 mb-4 pt-4">My Events</h3>
                {loadingEvents ? (
                    <p className="text-gray-400 text-sm mb-10">Loading events...</p>
                ) : events.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-dashed border-gray-200 text-center text-gray-400 text-sm mb-10">
                        No events found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {events.map(event => (
                            <div
                                key={event.event_id}
                                onClick={() => navigate(`/member/event/${event.event_id}`)}
                                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
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
                                <div className="space-y-3 mb-4">
                                    <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                    <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                    <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Tasks</span></div>
                                </div>
                                <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold cursor-pointer hover:text-blue-700">
                                    <span>View Details</span><ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MY TASKS */}
                <h3 id="tasks" className="text-lg font-bold text-gray-900 mb-4">My Tasks</h3>
                {myTasks.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-dashed border-gray-200 text-center text-gray-400 text-sm mb-10">
                        No tasks assigned yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {myTasks.map(task => (
                            <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-56">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-3 mb-4">{task.desc}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2"><Clock size={14} /> Due: {task.due}</div>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Event: {task.event}</span>
                                    <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">Assigned to: You</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TASKS TO APPROVE */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks to Approve</h3>
                {tasksToApprove.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-dashed border-gray-200 text-center text-gray-400 text-sm mb-10">
                        No tasks pending approval.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {tasksToApprove.map(task => (
                            <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                                <p className="text-xs text-gray-500 mb-4">{task.desc}</p>
                                <div className="flex justify-between items-center">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600">Event: {task.event}</span>
                                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700">Approve</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* OTHER EVENTS */}
                <h3 id="other-events" className="text-lg font-bold text-gray-900 mb-4 pt-4">Other Events</h3>
                {otherEvents.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 border border-dashed border-gray-200 text-center text-gray-400 text-sm mb-10">
                        No other ongoing events.
                    </div>
                ) : (
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x mb-10">
                        {otherEvents.map(event => (
                            <div
                                key={event.event_id}
                                onClick={() => navigate(`/events/${event.event_id}`)}
                                className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {event.event_name?.substring(0, 2).toUpperCase() || 'EV'}
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">{event.event_name}</h4>
                                </div>
                                <div className="space-y-3 mb-4">
                                    <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                </div>
                                <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold cursor-pointer hover:text-blue-700">
                                    <span>View Overview</span><ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default OrganizingCommitteeDashboard;