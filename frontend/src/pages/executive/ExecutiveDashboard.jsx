import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, DollarSign, Calendar, FileText,
    Bell, CheckCircle, XCircle, UserPlus, Clock, ChevronRight, Home
} from 'lucide-react';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';

const ExecutiveDashboard = () => {
    const navigate = useNavigate();
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);

    // --- 1. MOCK DATA ---
    const currentUser = {
        name: "Achila Abeysinghe",
        role: "President",
        id: "IM/2020/023",
        level: "Level 4",
        term: "2024/2025",
        skills: ["Project Management", "Leadership", "Public Speaking"]
    };

    const [tasksToApprove, setTasksToApprove] = useState([
        {
            id: 1,
            title: "Design Social Media Coming Soon Flyer",
            desc: "Create banner for Facebook and Instagram",
            due: "2025-07-10",
            assignedTo: "Kavindi Silva",
            event: "hackX 10.0"
        },
        {
            id: 2,
            title: "Prepare Speaker Invitations",
            desc: "Draft invitation emails for all speakers",
            due: "2025-07-12",
            assignedTo: "Nipun Jayasekara",
            event: "hackX 10.0"
        },
    ]);

    const [myTasks] = useState([
        { id: 101, title: "Submit Marketing Plan", desc: "Create and submit marketing plan for hackX 10.0", due: "2025-10-25", event: "hackX 10.0" },
        { id: 102, title: "Design Coming soon flyer", desc: "Create a poster for the upcoming hackX Jr. 8.0", due: "2025-10-20", event: "hackX Jr. 8.0" },
        { id: 103, title: "Design Magazine Page", desc: "Design magazine page for the Exposition 2025", due: "2025-11-15", event: "Exposition 2025" },
    ]);

    const [volunteerOps] = useState([
        { id: 1, title: "Registration Desk", desc: "Help with registration desk at the hackX 10.0", due: "2025-08-06", event: "hackX 10.0", color: "bg-teal-100 text-teal-800" },
        { id: 2, title: "Handle Logistics", desc: "Help during the event day with delegate handling and guests handling", due: "2025-08-06", event: "hackX Jr. 8.0", color: "bg-teal-100 text-teal-800" },
        { id: 3, title: "Hall Arrangement Team", desc: "Assist in arranging the auditorium seating and stage setup.", due: "2025-09-01", event: "General Assembly", color: "bg-blue-100 text-blue-800" },
    ]);

    const [events] = useState([
        { id: 1, name: "hackX 10.0", dateRange: "July 19 - November 11, 2025", phase: "Ideasprint Phase", oc: "Dineth Perera, Kavindi Silva, Nipun Jayasekara", tasks: 12 },
        { id: 2, name: "hackX Jr. 8.0", dateRange: "August 6 - November 11, 2025", phase: "Registration Open Phase", oc: "Lakshitha Gunasekara, Tharushi Weerasinghe", tasks: 8 },
        { id: 3, name: "Exposition 2025", dateRange: "September 5, 2025", phase: "Initial Planning", oc: "Kasun Rajapaksha, Sanduni Fernando", tasks: 15 }
    ]);

    // --- 2. HANDLERS ---
    const handleApprove = (id) => {
        setTasksToApprove(tasksToApprove.filter(item => item.id !== id));
        alert(`Task ${id} Approved!`);
    };

    const handleApply = (task) => {
        alert(`Successfully applied for: ${task.title}`);
        setSelectedVolunteerTask(null);
    };

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

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans">

            {/* 1. HEADER (Matches MemberDashboard - Generic) */}
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

                    {/* HOME ICON (Scrolls back to top) */}
                    <Home
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />

                    <div className="bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700">Executive</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* 2. DASHBOARD TITLE & ACTION BUTTONS */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Executive Board Dashboard</h2>
                        <p className="text-sm text-gray-500 font-medium">President View</p>
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

                {/* 3. PROFILE SECTION */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-5 w-full">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <Users size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{currentUser.name}</h3>
                            <p className="text-sm text-gray-500 mb-3">{currentUser.id} • {currentUser.level} • {currentUser.role}</p>
                            <div className="flex flex-wrap gap-2">
                                {currentUser.skills.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => navigate('/member/feedback')} className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                        Feedback
                    </button>
                </div>

                {/* 4. TASKS TO APPROVE (ID: approve-tasks) */}
                <ScrollSection id="approve-tasks" title="Tasks to Approve">
                    {tasksToApprove.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks requiring approval.
                        </div>
                    ) : (
                        tasksToApprove.map(task => (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="min-w-[350px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between snap-start cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{task.desc}</p>

                                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                                        <p>Due: {task.due}</p>
                                        <p>Assigned to: <span className="font-semibold text-gray-700">{task.assignedTo}</span></p>
                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">Event: {task.event}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-3 border-t border-gray-50">
                                    <button
                                        onClick={() => navigate(`/tasks/${task.id}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Review
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </ScrollSection>

                {/* 5. MY TASKS (ID: my-tasks) */}
                <ScrollSection id="my-tasks" title="My Tasks">
                    {myTasks.map(task => (
                        <div key={task.id}
                            onClick={() => navigate(`/exec/tasks/${task.id}`)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col snap-start">
                            <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{task.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <Clock size={14} /> Due: {task.due}
                            </div>
                            <div className="mb-4">
                                <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-[10px] font-bold">Event: {task.event}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                                Assigned to: You
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* 6. VOLUNTEER OPPORTUNITIES (ID: volunteer-opportunities) */}
                <ScrollSection id="volunteer-opportunities" title="Volunteer Opportunities">
                    {volunteerOps.map(op => (
                        <div
                            key={op.id}
                            onClick={() => setSelectedVolunteerTask(op)}
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

                {/* 7. EVENTS (ID: events) */}
                <ScrollSection id="events" title="Events">
                    {events.map(event => (
                        <div key={event.id}
                            onClick={() => navigate(`/exec/events/${event.id}`)}
                            className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer snap-start">
                            <div className="flex items-center gap-3 mb-4">
                                <h4 className="font-bold text-gray-800 text-sm">{event.name}</h4>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.dateRange}</span></div>
                                <div className="flex gap-3"><Clock size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.phase}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500 line-clamp-1">OC: {event.oc}</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">{event.tasks} Tasks</span>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* 8. TERM MANAGEMENT (ID: term-management) */}
                <div id="term-management" className="space-y-4 mb-8 scroll-mt-24">
                    <h3 className="text-lg font-bold text-gray-900">Term Management</h3>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-between items-end">
                        <div>
                            <h4 className="text-md font-bold text-gray-800">Current Term</h4>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{currentUser.term}</p>
                            <p className="text-xs text-gray-500 mt-2">Ends on: August 31, 2025</p>
                        </div>
                        <button
                            onClick={() => navigate('/exec/nominate-term')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                        >
                            Nominate Next Term
                        </button>
                    </div>
                </div>

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

export default ExecutiveDashboard;
