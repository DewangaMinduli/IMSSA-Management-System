import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, Home, User, FileText, Clock, Calendar,
    ChevronRight, Users, X, ArrowRight
} from 'lucide-react';

const OrganizingCommitteeDashboard = () => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    // MOCK USER - Sanjani Mapa
    const user = {
        name: "Sanjani Mapa",
        id: "IM/2022/006",
        level: "Level 3",
        skills: ["Project Management", "UI/UX Design", "Public Speaking"]
    };

    //my events
    const myEvent = {
        name: "hackX 10.0",
        date: "July 19 - November 11, 2025",
        phase: "Ideasprint Phase",
        oc: "You, Sajith Liyanagamage, Dinethya Samudini",
        budget: 750000,
        spent: 425000,
        tasks: 12
    };




    const tasksToApprove = [
        { id: 1, title: "Design Social Media Banner", desc: "Create banner for Facebook and Instagram", due: "2025-07-10", assignedTo: "Kavindi Silva", event: "hackX 10.0" },
        { id: 2, title: "Prepare Speaker Invitations", desc: "Draft invitation emails for all speakers", due: "2025-07-12", assignedTo: "Nipun Jayasekara", event: "hackX 10.0" }
    ];

    const myTasks = [
        { id: 1, title: "Submit Marketing Plan", desc: "Create and submit marketing plan for hackX 10.0", due: "2025-10-25", event: "hackX 10.0", color: "bg-teal-100 text-teal-800" },
        { id: 2, title: "Design Coming soon flyer", desc: "Create a poster for the upcoming hackX Jr. 8.0", due: "2025-10-20", event: "hackX Jr. 8.0", color: "bg-teal-100 text-teal-800" },
        { id: 3, title: "Design Magazine Page", desc: "Design magazine page for the Exposition 2025", due: "2025-11-15", event: "Exposition 2025", color: "bg-teal-100 text-teal-800" }
    ];

    const otherEvents = [
        { id: 2, name: "hackX Jr. 8.0", date: "August 6 - November 11, 2025", phase: "Registration Open Phase", oc: "Lakshitha Gunasekara, Tharushi Weerasinghe", tasks: 8 },
        { id: 3, name: "Exposition 2025", date: "September 5, 2025", phase: "Initial Planning", oc: "Kasun Rajapaksha, Sanduni Fernando", tasks: 15 }
    ];

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans">
            {/* HEADER */}
            {/* HEADER */}
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
                                    <div className="p-4 text-center text-gray-500 text-xs">No new notifications</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Home size={20} className="text-gray-500 cursor-pointer hover:text-teal-600 transition-colors" onClick={() => navigate('/')} />
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Organizing Committee</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* PAGE TITLE & ACTION */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <ArrowRight className="transform rotate-180 text-gray-800 cursor-pointer" size={20} onClick={() => window.history.back()} />
                        <h2 className="text-2xl font-bold text-gray-900">Organizing Committee Dashboard</h2>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <FileText size={16} /> Request Letter
                    </button>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex justify-between items-center mb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{user.id} • {user.level}</p>
                            <div className="flex gap-2">
                                {user.skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-md">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="bg-teal-100 text-teal-700 px-4 py-1.5 rounded-md text-xs font-bold hover:bg-teal-200 transition-colors">Feedback</button>
                </div>

                {/* MY EVENTS SECTION */}
                <h3 id="events" className="text-lg font-bold text-gray-900 mb-4">My Events</h3>
                <div
                    onClick={() => navigate('/member/event/hackx-10')}
                    className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm mb-10 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            {/* Replicating the hackX logo style roughly */}
                            <div className="flex items-end">
                                <span className="text-orange-400 font-bold text-3xl italic">hack</span>
                                <span className="text-orange-500 font-bold text-5xl italic -ml-1">X</span>
                            </div>
                            <div className="mt-2">
                                <span className="text-orange-400 font-bold text-xl ml-2">10.0</span>
                            </div>
                        </div>
                        <span className="text-orange-400 font-bold text-sm">hackX 10.0</span>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Calendar size={16} /> {myEvent.date}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Clock size={16} /> {myEvent.phase}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Users size={16} /> OC: {myEvent.oc}
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-sm font-bold text-gray-700">Budget: <span className="text-gray-900">Rs. {myEvent.budget.toLocaleString()}</span></p>
                        <p className="text-sm text-gray-500">Spent: Rs. {myEvent.spent.toLocaleString()}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg py-3 px-4 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                        <span className="text-xs font-bold text-gray-500">{myEvent.tasks} Tasks</span>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                </div>

                {/* MY TASKS */}
                <h3 id="tasks" className="text-lg font-bold text-gray-900 mb-4">My Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {myTasks.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-56">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-3 mb-4">{task.desc}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <Clock size={14} /> Due: {task.due}
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold bg-teal-100 text-teal-800`}>
                                    Event: {task.event}
                                </span>
                                <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                                    Assigned to: You
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TASKS TO APPROVE */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks to Approve</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {tasksToApprove.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4">{task.desc}</p>

                            <div className="space-y-1 mb-4 text-xs text-gray-500">
                                <div className="flex gap-2"><span>Due:</span> <span className="font-medium">{task.due}</span></div>
                                <div className="flex gap-2"><span>Assigned to:</span> <span className="font-medium">{task.assignedTo}</span></div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600">Event: {task.event}</span>
                                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* OTHER EVENTS */}
                <h3 id="other-events" className="text-lg font-bold text-gray-900 mb-4">Other Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                    {otherEvents.map(event => (
                        <div key={event.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                {/* Simple Logo Placeholder */}
                                <div className="text-orange-400 font-bold italic text-lg">{event.name.split(' ')[0]}<span className="text-orange-500">X</span></div>
                                <h4 className="font-bold text-gray-800 text-sm">{event.name}</h4>
                            </div>
                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.date}</span></div>
                                <div className="flex gap-3"><Clock size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.phase}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">OC: {event.oc}</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center cursor-pointer hover:text-blue-600">
                                <span className="text-xs text-gray-400 font-medium">{event.tasks} Tasks</span>
                                <ChevronRight size={14} className="text-gray-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrganizingCommitteeDashboard;