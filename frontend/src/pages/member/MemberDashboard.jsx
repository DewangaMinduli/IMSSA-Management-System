import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, User, FileText, Clock, Calendar,
    ChevronRight, Users, X
} from 'lucide-react';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';

const MemberDashboard = () => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null); // State for the modal

    // --- MOCK NOTIFICATIONS ---
    const notifications = [
        { id: 1, title: "Task Due Soon", msg: "Marketing Plan is due tomorrow!", time: "2 hrs ago", type: "urgent" },
        { id: 2, title: "New Event", msg: "HackX 10.0 has been announced.", time: "1 day ago", type: "info" },
        { id: 3, title: "Assignment", msg: "You were assigned to 'Hall Arrangement'.", time: "2 days ago", type: "info" }
    ];

    const user = {
        name: "Dewanga Gunawardana",
        id: "IM/2022/037",
        level: "Level 3",
        skills: ["Project Management", "Content Creation", "Public Speaking"]
    };

    const myTasks = [
        { id: 1, title: "Proof read the hackX proposal", desc: "Proof read whole content of hackX proposal", due: "2025-10-25", event: "hackX 10.0", color: "bg-teal-100 text-teal-800" },
        { id: 2, title: "Design caption for Coming soon flyer", desc: "Create a suitable caption for coming soon flyer.", due: "2025-10-20", event: "hackX Jr. 8.0", color: "bg-teal-100 text-teal-800" },
        { id: 3, title: "Design Magazine Page", desc: "Design magazine page for the Exposition 2025", due: "2025-11-15", event: "Exposition 2025", color: "bg-teal-100 text-teal-800" }
    ];

    const volunteerOps = [
        { id: 1, title: "Registration Desk", desc: "Help with registration desk at the hackX 10.0", due: "2025-08-06", event: "hackX 10.0", color: "bg-teal-100 text-teal-800" },
        { id: 2, title: "Handle Logistics", desc: "Help during the event day with delegate handling and guests handling", due: "2025-08-06", event: "hackX Jr. 8.0", color: "bg-teal-100 text-teal-800" },
        { id: 3, title: "Hall Arrangement Team", desc: "Assist in arranging the auditorium seating and stage setup.", due: "2025-09-01", event: "General Assembly", color: "bg-blue-100 text-blue-800" },
        {
            id: 4,
            title: "Design a presentation",
            desc: "Create a detailed presentation about IM student life.",
            due: "2025-04-01",
            event: "Open Day 2025",
            color: "bg-blue-100 text-blue-800"
        }
    ];

    const events = [
        { id: 1, name: "hackX 10.0", dateRange: "July 19 - Nov 11, 2025", phase: "Ideasprint Phase", oc: "Dineth Perera, Kavindi Silva", tasks: 12 },
        { id: 2, name: "hackX Jr. 8.0", dateRange: "Aug 6 - Nov 11, 2025", phase: "Registration Open", oc: "Lakshitha Gunasekara", tasks: 8 },
        { id: 3, name: "Exposition 2025", dateRange: "Sept 5, 2025", phase: "Initial Planning", oc: "Kasun Rajapaksha", tasks: 15 }
    ];

    // Helper for Horizontal Scrolling Sections with ID support
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

    const handleApply = (task) => {
        // Here you would call your API to apply
        alert(`Successfully applied for: ${task.title}`);
        setSelectedVolunteerTask(null); // Close modal
    };

    return (
        <div className="pb-10 relative">

            {/* 1. FIXED HEADER (Using Sticky so it doesn't scroll away) */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative">

                    {/* A. NOTIFICATION BELL */}
                    <div className="relative">
                        <Bell
                            size={20}
                            className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                            onClick={() => setShowNotifications(!showNotifications)}
                        />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>

                        {/* NOTIFICATION POPUP */}
                        {showNotifications && (
                            <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50 animate-fade-in-down">
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                                    <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowNotifications(false)} />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className="p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${n.type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {n.type === 'urgent' ? 'Urgent' : 'Update'}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{n.time}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                                            <p className="text-[10px] text-gray-500 line-clamp-2">{n.msg}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* B. HOME ICON (Scrolls back to top) */}
                    <Home
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => {
                            const mainContent = document.getElementById('main-content');
                            if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />

                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Member</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* 2. PAGE HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Member Dashboard</h2>
                    <button
                        onClick={() => navigate('/member/request-letter')}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                    >
                        <FileText size={16} /> Request Letter
                    </button>
                </div>

                {/* 3. PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-5 w-full">
                        {/* Clickable Avatar to go to Profile */}
                        <div
                            onClick={() => navigate('/member/profile')}
                            className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            <User size={40} />
                        </div>

                        <div>
                            <h3
                                onClick={() => navigate('/member/profile')}
                                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-teal-600 transition-colors"
                            >
                                {user.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">{user.id} • {user.level}</p>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/member/feedback')}
                        className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Feedback
                    </button>
                </div>

                {/* 4. SECTIONS (IDs are crucial here) */}

                {/* ID: tasks */}
                <ScrollSection id="tasks" title="My Tasks">
                    {myTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => navigate(`/member/tasks/${task.id}`)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-teal-600 transition-colors">{task.title}</h4>
                            </div>

                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">{task.desc}</p>

                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <Clock size={14} /> Due: {task.due}
                            </div>

                            <div className="mb-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${task.color}`}>
                                    Event: {task.event}
                                </span>
                            </div>

                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
                                <span>Assigned to: You</span>
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* ID: volunteer */}
                <ScrollSection id="volunteer" title="Volunteer Opportunities">
                    {volunteerOps.map(op => (
                        <div
                            key={op.id}
                            onClick={() => setSelectedVolunteerTask(op)} // Open Modal on Click
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
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

                {/* ID: events */}
                <ScrollSection id="events" title="Events">
                    {events.map(event => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow snap-start cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <h4 className="font-bold text-gray-800 text-sm">{event.name}</h4>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.dateRange}</span></div>
                                <div className="flex gap-3"><Clock size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.phase}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">OC: {event.oc}</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center"><span className="text-xs text-gray-400 font-medium">{event.tasks} Tasks</span><ChevronRight size={14} className="text-gray-300" /></div>
                        </div>
                    ))}
                </ScrollSection>
            </div>
            {/* VOLUNTEER MODAL */}
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