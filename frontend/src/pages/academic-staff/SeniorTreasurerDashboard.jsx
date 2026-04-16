import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, Users, Clock, ArrowRight, Bell, Home, X, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from '../../components/UserDropdown';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SeniorTreasurerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [financeData, setFinanceData] = useState({ accounts: [], transactions: [], events: [] });
    // Phase 5 States
    const [allEvents, setAllEvents] = useState([]);
    const [skills, setSkills] = useState([]);
    const [recRequests, setRecRequests] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All'); // 'Event', 'Account'
    const [filterValue, setFilterValue] = useState('');
    const [selectedAnalytics, setSelectedAnalytics] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [skillSearch, setSkillSearch] = useState('');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [skillMembers, setSkillMembers] = useState([]);
    const [skillMembersLoading, setSkillMembersLoading] = useState(false);

    const handleSkillClick = async (skill) => {
        setSelectedSkill(skill);
        setSkillMembersLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/users/skills/members?tag_id=${skill.skill_id}`);
            if (res.ok) setSkillMembers(await res.json());
        } catch (err) {
            console.error('Skill members fetch error', err);
        } finally {
            setSkillMembersLoading(false);
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

    // Derived lists for dropdowns
    // Extract unique active event names from financeData.events
    const uniqueEvents = [...new Set((financeData.events || []).map(e => e.event_name))];
    // Extract unique account names from financeData.accounts
    const uniqueAccounts = [...new Set((financeData.accounts || []).map(a => a.account_name))];

    // Filtered Transactions
    const filteredTransactions = (financeData.transactions || []).filter(t => {
        if (filterType === 'All') return true;
        if (filterType === 'Event' && filterValue) return t.event_name === filterValue;
        if (filterType === 'Account' && filterValue) return t.account_name === filterValue;
        return true;
    });

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

    const fetchData = async () => {
        try {
            // Fetch Finance Summary
            const resFinance = await fetch('http://localhost:5000/api/finance/dashboard-summary');
            if (resFinance.ok) setFinanceData(await resFinance.json());

            // Fetch All Events
            const resEvents = await fetch('http://localhost:5000/api/events');
            if (resEvents.ok) setAllEvents(await resEvents.json());

            // Fetch Skills
            const resSkills = await fetch('http://localhost:5000/api/users/skills');
            if (resSkills.ok) setSkills(await resSkills.json());

            // Fetch Recommendation Requests
            const resRequests = await fetch('http://localhost:5000/api/users/requests');
            if (resRequests.ok) setRecRequests(await resRequests.json());

        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setStudents([]);
            setSelectedAnalytics(null);
            return;
        }
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${searchQuery}`);
            if (res.ok) {
                setStudents(await res.json());
                setSelectedAnalytics(null);
            }
        } catch (err) {
            console.error("Search error", err);
        }
    };

    const handleApproveTransaction = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/finance/transaction/${id}/approve`, {
                method: 'PUT',
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to approve transaction.");
            }
        } catch (err) {
            console.error("Error approving transaction", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="pb-10 relative bg-gray-50 min-h-screen font-sans">
            {/* HEADER */}
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
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">Senior Treasurer</div>
                    <UserDropdown user={user} colorClass="bg-slate-100 text-slate-700" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* TITLE with Back Button & Actions */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <ArrowRight
                            className="transform rotate-180 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors flex-shrink-0"
                            size={22}
                            onClick={() => window.history.back()}
                        />
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                Hi, {user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'there'} 👋
                            </p>
                            <p className="text-sm text-gray-400 mt-0.5">Welcome back.</p>
                        </div>
                    </div>
                    <button onClick={() => window.location.href = '/academic-staff/feedback'} className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-teal-200 shadow-sm">
                        View Feedback
                    </button>
                </div>

                {/* PROFILE CARD */}
                <Link to="/member/profile" className="block mb-10">
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-5 w-full">
                            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-3xl">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h3>
                                <p className="text-sm text-gray-500">{user?.role_name || user?.user_type} • University of Kelaniya</p>
                                <p className="text-xs text-teal-600 font-medium mt-1">Academic Staff Member</p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* 1. FINANCIAL OVERVIEW */}
                <section id="financial-overview" className="mb-10 scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Financial Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Net Worth Card (Matched with JT) */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-xl shadow-md text-white border-0 flex flex-col justify-between relative overflow-hidden h-full">
                            <TrendingUp className="absolute -right-2 -bottom-2 text-white/10 opacity-20" size={100} />
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-blue-100/80">Total Net Worth</p>
                                <h3 className="text-xl font-black mt-2">
                                    Rs. {financeData.accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {financeData.accounts.map(acc => (
                            <div key={acc.account_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group h-full transition-all hover:shadow-md">
                                <div className="relative z-10">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{acc.account_name}</p>
                                    <h3 className={`text-xl font-bold mt-1.5 ${Number(acc.current_balance) < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                        Rs. {Number(acc.current_balance).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">Active Account</span>
                                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. PENDING ACTION SUMMARY */}
                <section id="pending-approvals" className="mb-10 scroll-mt-24">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Pending Financial Approvals</h2>
                        {financeData.transactions.filter(t => t.status === 'Pending').length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                {financeData.transactions.filter(t => t.status === 'Pending').length} ACTION REQUIRED
                            </span>
                        )}
                    </div>
                    
                    {financeData.transactions.filter(t => t.status === 'Pending').length === 0 ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                    <TrendingUp size={24} />
                                </div>
                                <p>All transactions have been reviewed. No pending approvals.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-yellow-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Review Required</p>
                                    <p className="text-xs text-gray-500">
                                        You have <strong>{financeData.transactions.filter(t => t.status === 'Pending').length}</strong> transactions totaling 
                                        <strong> Rs. {financeData.transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + parseFloat(t.amount), 0).toLocaleString()} </strong>
                                        awaiting your verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* 3. TRANSACTIONS TABLE */}
                <section id="transactions" className="scroll-mt-24 mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Transactions</h2>
                        <div className="flex gap-3">
                            {/* 1. Filter Type Dropdown */}
                            <select
                                className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg outline-none border-none"
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setFilterValue(''); // Reset value when type changes
                                }}
                            >
                                <option value="All">All Transactions</option>
                                <option value="Event">By Event</option>
                                <option value="Account">By Account</option>
                            </select>

                            {/* 2. Specific item Dropdown (Changes based on selection 1) */}
                            {filterType !== 'All' && (
                                <select
                                    className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg outline-none border-none"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                >
                                    <option value="">Select Option</option>
                                    {filterType === 'Event' && uniqueEvents.map(evt => (
                                        <option key={evt} value={evt}>{evt}</option>
                                    ))}
                                    {filterType === 'Account' && uniqueAccounts.map(acc => (
                                        <option key={acc} value={acc}>{acc}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Event</th>
                                    <th className="px-6 py-3">Account</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTransactions.map((t) => (
                                    <tr key={t.transaction_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-500 font-bold text-xs">{new Date(t.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-600">{t.description}</td>
                                        <td className="px-6 py-4 text-gray-500">{t.event_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{t.account_name}</td>
                                        <td className={`px-6 py-4 font-bold ${t.transaction_type === 'Expense' ? 'text-red-500' : 'text-green-500'}`}>
                                            {t.transaction_type === 'Expense' ? `- Rs. ${Number(t.amount).toLocaleString()}` : `+ Rs. ${Number(t.amount).toLocaleString()}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.status === 'Pending' ? (
                                                <button
                                                    onClick={() => handleApproveTransaction(t.transaction_id)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-xs font-medium">Reviewed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 4. ACADEMIC SECTIONS (Search, Skills, Recs, Events) */}

                {/* Student Search */}
                <section id="student-search" className="mb-10 scroll-mt-24">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Search for Students</h2>
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 mb-4">
                        <div className="flex-1 px-4">
                            <input
                                type="text"
                                placeholder="Search by Student No. or Name"
                                className="w-full h-10 outline-none text-gray-600 text-sm placeholder-gray-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold text-sm transition-colors">Search</button>
                    </div>

                    {/* Search Results */}
                    {students.length > 0 && (
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
                                            <span className="flex items-center gap-1"><Users size={14} /> {selectedAnalytics.student_number}</span>
                                            <span className="flex items-center gap-1"><Calendar size={14} /> Level {selectedAnalytics.academic_level || 'N/A'} - {selectedAnalytics.academic_year || 'Year 1'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAnalytics(null)} className="text-teal-200 hover:text-white transition-colors relative z-10"><X size={24} /></button>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Event Tracker */}
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

                                {/* Skills Matrix */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={16} className="text-teal-500" /> Acquired Skills Graph</h4>
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
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Skill Inventory */}
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
                        {skillSearch && <button onClick={() => { setSkillSearch(''); setSelectedSkill(null); setSkillMembers([]); }} className="text-gray-400 hover:text-gray-600 px-3"><X size={16} /></button>}
                    </div>

                    {/* Skill List — only shown when user starts typing */}
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
                                    className={`flex justify-between items-center px-6 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selectedSkill?.skill_id === skill.skill_id ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="font-medium text-gray-700 flex items-center gap-3"><FileText size={16} className="text-teal-500" /> {skill.name}</span>
                                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full border border-teal-100">{skill.count} Members</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Members with Selected Skill */}
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
                                    {skillMembers.map((m, idx) => (
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

                {/* Recommendation Requests */}
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
                                            <span>{req.student_no}</span><span>•</span><span>Requested on {new Date(req.request_date).toLocaleDateString()}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">Generate Letter</button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Events */}
                <ScrollSection id="events" title="Events">
                    {allEvents.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No ongoing events.
                        </div>
                    ) : allEvents.map(event => (
                        <div 
                            key={event.event_id}
                            onClick={() => navigate(`/events/${event.event_id}`)}
                            className="min-w-[340px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow snap-start cursor-pointer flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {event.event_name ? event.event_name.substring(0, 2).toUpperCase() : 'EV'}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm">{event.event_name}</h3>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Total Tasks</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold">
                                <span>View Details</span><ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

            </div>
        </div>
    );
};

export default SeniorTreasurerDashboard;
