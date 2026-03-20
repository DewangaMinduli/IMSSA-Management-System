import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, Users, Clock, ArrowRight, Bell, Home, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AcademicStaffDashboard = () => {
    const { user } = useAuth();

    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedAnalytics, setSelectedAnalytics] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [skills, setSkills] = useState([]);
    const [skillSearch, setSkillSearch] = useState('');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [skillMembers, setSkillMembers] = useState([]);
    const [skillMembersLoading, setSkillMembersLoading] = useState(false);

    const [recRequests, setRecRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- FETCH ALL LIVE DATA ---
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [resEvents, resSkills, resRequests] = await Promise.all([
                    fetch('http://localhost:5000/api/events'),
                    fetch('http://localhost:5000/api/users/skills'),
                    fetch('http://localhost:5000/api/users/requests'),
                ]);
                if (resEvents.ok) setEvents(await resEvents.json());
                if (resSkills.ok) setSkills(await resSkills.json());
                if (resRequests.ok) setRecRequests(await resRequests.json());
            } catch (err) {
                console.error('Error fetching dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // --- STUDENT SEARCH ---
    const handleSearch = async () => {
        if (!searchTerm.trim()) { setStudents([]); setSelectedAnalytics(null); return; }
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${searchTerm}`);
            if (res.ok) { setStudents(await res.json()); setSelectedAnalytics(null); }
        } catch (err) { console.error('Search error', err); }
    };

    // --- STUDENT ANALYTICS ---
    const fetchAnalytics = async (userId) => {
        setAnalyzing(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/${userId}/analytics`);
            if (res.ok) setSelectedAnalytics(await res.json());
        } catch (err) { console.error('Analytics fetch error', err); }
        finally { setAnalyzing(false); }
    };

    // --- SKILL MEMBERS ---
    const handleSkillClick = async (skill) => {
        setSelectedSkill(skill);
        setSkillMembersLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/skills/members?tag_id=${skill.skill_id}`);
            if (res.ok) setSkillMembers(await res.json());
        } catch (err) { console.error('Skill members fetch error', err); }
        finally { setSkillMembersLoading(false); }
    };

    return (
        <div className="pb-10 relative bg-gray-50 min-h-screen font-sans">

            {/* ── HEADER ── */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs">IM</div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-xs text-gray-500">University of Kelaniya</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Bell size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer" />
                    <Home size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Academic Staff</div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">

                {/* ── BACK ARROW + VIEW FEEDBACK ── */}
                <div className="flex items-center justify-between mb-8">
                    <ArrowRight
                        className="transform rotate-180 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                        size={24}
                        onClick={() => window.history.back()}
                    />
                    <button
                        onClick={() => window.location.href = '/academic-staff/feedback'}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-teal-200 shadow-sm"
                    >
                        View Feedback
                    </button>
                </div>

                {/* ── PROFILE CARD ── */}
                <Link to="/member/profile" className="block mb-10">
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-5 w-full">
                            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-3xl">
                                {user?.name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{user?.name || user?.full_name || 'User'}</h3>
                                <p className="text-sm text-gray-500">{user?.role_name || user?.user_type} • University of Kelaniya</p>
                                <p className="text-xs text-teal-600 font-medium mt-1">Academic Staff Member</p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* ── 1. STUDENT SEARCH ── */}
                <section id="student-search" className="mb-10 scroll-mt-24">
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
                                    <button
                                        onClick={() => fetchAnalytics(student.user_id)}
                                        className="bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                                    >
                                        {analyzing ? 'Loading...' : 'Generate Analytic Profile'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Analytic Profile */}
                    {selectedAnalytics && (
                        <div className="bg-white rounded-xl shadow-lg border border-teal-100 mt-6 overflow-hidden">
                            <div className="bg-teal-600 p-6 text-white flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full opacity-50 transform translate-x-1/3 -translate-y-1/4" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-20 h-20 rounded-full bg-white text-teal-600 flex items-center justify-center font-bold text-3xl shadow-md border-4 border-teal-500">
                                        {selectedAnalytics.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedAnalytics.full_name}</h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-teal-50 text-sm font-medium">
                                            <span className="flex items-center gap-1"><Users size={14} /> {selectedAnalytics.student_number}</span>
                                            <span className="flex items-center gap-1"><Calendar size={14} /> Level {selectedAnalytics.academic_level || 'N/A'} - {selectedAnalytics.academic_year || 'Year 1'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAnalytics(null)} className="text-teal-200 hover:text-white transition-colors relative z-10"><X size={24} /></button>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Calendar size={16} className="text-orange-500" /> Event Participation</h4>
                                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {selectedAnalytics.eventRoles.length === 0 && selectedAnalytics.completedTasks.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No formal event history recorded.</p>
                                        ) : (
                                            <>
                                                {selectedAnalytics.eventRoles.map((role, idx) => (
                                                    <div key={`r-${idx}`} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
                                                        <div className="bg-orange-500 text-white rounded p-1"><Users size={14} /></div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{role.event_name}</p>
                                                            <p className="text-xs text-orange-700 font-semibold">{role.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {selectedAnalytics.completedTasks.map((task, idx) => (
                                                    <div key={`t-${idx}`} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-start gap-3">
                                                        <div className="bg-blue-500 text-white rounded p-1"><FileText size={14} /></div>
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
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} className="text-teal-500" /> Acquired Skills</h4>
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-h-[12rem]">
                                        {selectedAnalytics.skills.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No skills acquired yet.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAnalytics.skills.map((skill, idx) => (
                                                    <div key={idx} className="bg-white border border-teal-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-sm font-semibold text-gray-800">
                                                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                                                        {skill.skill_name}
                                                        <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md font-bold">{skill.points} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── 2. SKILL INVENTORY ── */}
                <section id="skill-inventory" className="mb-10 scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Skill Inventory</h2>
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 mb-4">
                        <div className="flex-1 px-4">
                            <input
                                type="text"
                                placeholder="Type to filter skills..."
                                className="w-full h-10 outline-none text-gray-600 text-sm placeholder-gray-400"
                                value={skillSearch}
                                onChange={(e) => { setSkillSearch(e.target.value); setSelectedSkill(null); setSkillMembers([]); }}
                            />
                        </div>
                        {skillSearch && (
                            <button onClick={() => { setSkillSearch(''); setSelectedSkill(null); setSkillMembers([]); }} className="text-gray-400 hover:text-gray-600 px-3">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {skillSearch.trim() === '' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-8 text-center text-gray-400 text-sm italic mb-4">
                            Type a skill name above to search and see members.
                        </div>
                    ) : skills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase())).length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-8 text-center text-gray-500 text-sm mb-4">
                            No skill found matching "{skillSearch}"
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                            {skills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase())).map((skill) => (
                                <div
                                    key={skill.skill_id}
                                    onClick={() => handleSkillClick(skill)}
                                    className={`flex justify-between items-center px-6 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selectedSkill?.skill_id === skill.skill_id ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'hover:bg-gray-50'}`}
                                >
                                    <span className="font-medium text-gray-700 flex items-center gap-3"><FileText size={16} className="text-teal-500" /> {skill.name}</span>
                                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-100">{skill.count} Members</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedSkill && (
                        <div className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden">
                            <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
                                <h3 className="font-bold text-teal-800 text-sm">Members skilled in: <span className="text-teal-600">{selectedSkill.name}</span></h3>
                                <button onClick={() => { setSelectedSkill(null); setSkillMembers([]); }} className="text-teal-400 hover:text-teal-700"><X size={16} /></button>
                            </div>
                            {skillMembersLoading ? (
                                <p className="text-center text-gray-400 text-sm py-8">Loading members...</p>
                            ) : skillMembers.length === 0 ? (
                                <p className="text-center text-gray-500 italic text-sm py-8">No members found in this area.</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {skillMembers.map((m) => (
                                        <div key={m.user_id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm">
                                                    {m.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{m.full_name}</p>
                                                    <p className="text-xs text-gray-400">{m.student_no} · {m.role_name}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">{m.points} pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ── 3. RECOMMENDATION REQUESTS ── */}
                <section id="recommendation-requests" className="mb-10 scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recommendation Letter Requests</h2>
                    <div className="space-y-4">
                        {recRequests.length === 0 ? (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm">No pending requests.</div>
                        ) : recRequests.map(req => (
                            <div key={req.request_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {req.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{req.full_name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                            <span>{req.student_no}</span><span>•</span>
                                            <span>Requested on {new Date(req.request_date).toLocaleDateString()}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                                    Generate Letter
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 4. EVENTS ── */}
                <section id="events" className="mb-10 scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Events</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {loading ? (
                            <p className="text-gray-500 col-span-3">Loading events...</p>
                        ) : events.length === 0 ? (
                            <div className="col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm">No ongoing events.</div>
                        ) : events.map(event => (
                            <Link to={`/events/${event.event_id}`} key={event.event_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {event.event_name ? event.event_name.substring(0, 2).toUpperCase() : 'EV'}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm">{event.event_name}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                                </div>
                                <div className="space-y-4 mb-4">
                                    <div className="flex gap-3"><Calendar size={16} className="text-gray-400" /><span className="text-xs text-gray-600">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500"><Users size={16} className="text-gray-400" /> {event.oc_count || 0} Committee Members</div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500"><FileText size={16} className="text-gray-400" /> {event.task_count || 0} Total Tasks</div>
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold">
                                    <span>View Details</span><ArrowRight size={14} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default AcademicStaffDashboard;
