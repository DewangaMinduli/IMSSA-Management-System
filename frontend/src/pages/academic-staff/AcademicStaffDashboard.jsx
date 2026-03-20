import React, { useState } from 'react';
import { Search, FileText, Calendar, Users, Clock, ArrowRight, Bell, Home, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AcademicStaffDashboard = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedAnalytics, setSelectedAnalytics] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setStudents([]);
            setSelectedAnalytics(null);
            return;
        }
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${searchTerm}`);
            if (res.ok) {
                 setStudents(await res.json());
                 setSelectedAnalytics(null);
            }
        } catch (err) {
            console.error("Search error", err);
        }
    };

    const fetchAnalytics = async (userId) => {
        setAnalyzing(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/analytics`);
            if (res.ok) setSelectedAnalytics(await res.json());
        } catch (err) {
            console.error("Analytics fetch error", err);
        } finally {
            setAnalyzing(false);
        }
    };

    // MOCK_NOTIFICATIONS
    const notifications = [
        { id: 1, title: "New Event", msg: "HackX 10.0 has been announced.", time: "1 day ago", type: "info" }
    ];

    // MOCK DATA for Skill Inventory

    // MOCK DATA for Skill Inventory
    const skills = [
        { name: 'UI/UX Design', count: 8 },
        { name: 'Compering', count: 5 },
        { name: 'Leadership', count: 10 },
        { name: 'Data Analysis', count: 7 },
    ];

    // MOCK DATA for Recommendation Requests
    const recRequests = [
        { id: 2, name: 'Dewanga Gunawardana', studentNo: 'IM/2022/037', date: '2025-06-03' },
    ];

    // LIVE DATA STATE
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // FETCH EVENTS FROM DB
    React.useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/events');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                } else {
                    console.error("Failed to fetch events");
                }
            } catch (err) {
                console.error("Error connecting to backend", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="pb-10 relative bg-gray-50 min-h-screen font-sans">

            {/* 1. FIXED HEADER (Same as Member) */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative">

                    <button className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors border border-teal-200 shadow-sm mr-2">
                        View Feedback
                    </button>

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

                    {/* B. HOME ICON */}
                    <Home
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    />

                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 ml-2">Academic Staff</div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Academic Staff Dashboard</h1>
                </div>

                {/* 1. Search for Students */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Search for Students</h2>
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 mb-4">
                        <div className="flex-1 px-4">
                            <input
                                type="text"
                                placeholder="Search by Student No. or Name"
                                className="w-full h-10 outline-none text-gray-600 text-sm placeholder-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                            Search
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchTerm && students.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm">
                            No students found matching "{searchTerm}"
                        </div>
                    ) : students.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                            {students.map(student => (
                                <div key={student.user_id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {student.full_name?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{student.full_name}</h4>
                                            <p className="text-xs text-gray-500">{student.student_no} • {student.role_name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => fetchAnalytics(student.user_id)} className="bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm">{analyzing ? 'Loading...' : 'Generate Analytic Profile'}</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analytic Profile Modal / Expanded View */}
                    {selectedAnalytics && (
                        <div className="bg-white rounded-xl shadow-lg border border-teal-100 mt-6 overflow-hidden animate-fade-in-up">
                            {/* Header Plate */}
                            <div className="bg-teal-600 p-6 text-white flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full opacity-50 transform translate-x-1/3 -translate-y-1/4"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-20 h-20 rounded-full bg-white text-teal-600 flex items-center justify-center font-bold text-3xl shadow-md border-4 border-teal-500">
                                        {selectedAnalytics.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedAnalytics.full_name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-teal-50 text-sm font-medium">
                                            <span className="flex items-center gap-1"><Users size={14}/> {selectedAnalytics.student_number}</span>
                                            <span className="flex items-center gap-1"><Calendar size={14}/> Level {selectedAnalytics.academic_level || 'N/A'} - {selectedAnalytics.academic_year || 'Year 1'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAnalytics(null)} className="text-teal-200 hover:text-white transition-colors relative z-10"><X size={24} /></button>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Event Tracker */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Calendar size={16} className="text-orange-500"/> Event Participation</h4>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {selectedAnalytics.eventRoles.length === 0 && selectedAnalytics.completedTasks.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No formal event history recorded.</p>
                                        ) : (
                                            <>
                                                {selectedAnalytics.eventRoles.map((role, idx) => (
                                                    <div key={`r-${idx}`} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
                                                        <div className="bg-orange-500 text-white rounded p-1"><Users size={14}/></div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{role.event_name}</p>
                                                            <p className="text-xs text-orange-700 font-semibold">{role.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {selectedAnalytics.completedTasks.map((task, idx) => (
                                                    <div key={`t-${idx}`} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-3">
                                                        <div className="bg-blue-500 text-white rounded p-1"><FileText size={14}/></div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{task.event_name}</p>
                                                            <p className="text-xs text-blue-700 font-semibold">Task Completed: {task.task_name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Skills Matrix */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} className="text-teal-500"/> Acquired Skills Graph</h4>
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-h-[12rem]">
                                        {selectedAnalytics.skills.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic flex h-full items-center justify-center">No skills acquired yet.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAnalytics.skills.map((skill, idx) => (
                                                    <div key={idx} className="bg-white border border-teal-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                                        {skill.skill_name}
                                                        <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md font-bold">{skill.points} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2">
                                            Evaluate for Draft Letter <ArrowRight size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </section>

                {/* 2. Skill Inventory */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Skill Inventory</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        {/* Search within Skills - Optional visual element from screenshot often implies search capability */}
                        <div className="mb-4">
                            <input type="text" placeholder="Search for a skill" className="text-sm text-gray-400 outline-none w-full" />
                        </div>

                        {skills.map((skill, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="text-blue-500 bg-blue-50 p-2 rounded-lg">
                                        <FileText size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{skill.name}</span>
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{skill.count} Students</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Recommendation Letter Requests */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recommendation Letter Requests</h2>
                    <div className="space-y-4">
                        {recRequests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900">{req.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <span>{req.studentNo}</span>
                                        <span>•</span>
                                        <span>Requested on {req.date}</span>
                                    </div>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                                    Generate Letter
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Events */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Events</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {loading ? <p className="text-gray-500">Loading Events...</p> : events.map(event => (
                            <div key={event.event_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-6">
                                    {/* Auto-generate colors based on ID if not present */}
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs bg-orange-100 text-orange-600`}>
                                        {event.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm">{event.name}</h3>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={16} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">{event.date_range}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock size={16} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">{event.phase || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Users size={16} className="text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">OC: {event.oc_members || 'TBD'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-gray-400 text-xs font-medium">
                                    <span>Active</span>
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>



            </div>
        </div>
    );
};

export default AcademicStaffDashboard;
