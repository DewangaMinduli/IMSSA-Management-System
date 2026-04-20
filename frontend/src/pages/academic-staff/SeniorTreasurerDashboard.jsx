import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, Users, Clock, ArrowRight, Bell, Home, X, Download, TrendingUp, TrendingDown, DollarSign, Trash2, Plus, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from '../../components/UserDropdown';
import { Link, useNavigate } from 'react-router-dom';
import { useNotify } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import BudgetReportModal from '../../components/BudgetReportModal';
import { formatDate } from '../../utils/dateFormatter';

const SeniorTreasurerDashboard = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const { confirm } = useConfirm();
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
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    // Reject Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectTransactionId, setRejectTransactionId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

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
    const uniqueEvents = [...new Set((allEvents || []).map(e => e.event_name))];
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
            // Fetch All Finance Data (Accounts + ALL Transactions for auditing)
            const [resAccounts, resTransactions, resEvents, resSkills] = await Promise.all([
                fetch('http://localhost:5000/api/finance/dashboard-summary'), // For accounts
                fetch('http://localhost:5000/api/finance/transactions'),      // ALL transactions
                fetch('http://localhost:5000/api/events'),
                fetch('http://localhost:5000/api/users/skills')
            ]);

            if (resAccounts.ok && resTransactions.ok) {
                const accData = await resAccounts.json();
                const txData = await resTransactions.json();
                setFinanceData({
                    accounts: accData.accounts || [],
                    transactions: txData || [], // transactions are the direct array from this endpoint
                    events: accData.events || []
                });
            }

            if (resEvents.ok) setAllEvents(await resEvents.json());
            if (resSkills.ok) setSkills(await resSkills.json());

            // Fetch Recommendation Requests
            const resRequests = await fetch(`http://localhost:5000/api/users/requests?lecturer_id=${user.id}`);
            if (resRequests.ok) setRecRequests(await resRequests.json());

        } catch (err) {
            console.error('Error fetching dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${searchQuery}`);
            if (res.ok) setStudents(await res.json());
        } catch (err) {
            console.error('Search error', err);
        }
    };

    const handleApproveTransaction = async (id) => {
        const ok = await confirm("Verify and approve this transaction? This will mark it as audited and lock it from further edits.");
        if (!ok) return;
        try {
            const res = await fetch(`http://localhost:5000/api/finance/transaction/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            if (res.ok) {
                notify("Transaction successfully verified.", "success");
                fetchData();
            } else {
                notify("Failed to approve transaction.", "error");
            }
        } catch (err) {
            console.error("Error approving transaction", err);
        }
    };

    const handleRejectTransaction = (id) => {
        setRejectTransactionId(id);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const submitRejection = async () => {
        if (!rejectReason.trim()) {
            notify("Please provide a reason for rejection.", "error");
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:5000/api/finance/transaction/${rejectTransactionId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason, user_id: user.id })
            });
            if (res.ok) {
                notify("Transaction rejected.", "success");
                setShowRejectModal(false);
                setRejectTransactionId(null);
                fetchData();
            } else {
                notify("Failed to reject transaction.", "error");
            }
        } catch (err) {
            console.error("Error rejecting transaction", err);
        }
    };

    const handleDeleteRequest = async (id) => {
        const ok = await confirm("Are you sure you want to remove this recommendation letter request from the system?");
        if (!ok) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/requests/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                notify("Request removed successfully.", "success");
                fetchData();
            } else {
                notify("Failed to delete request.", "error");
            }
        } catch (err) {
            console.error("Error deleting request", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="pb-10 relative bg-gray-50 min-h-screen font-sans px-8 print:p-0 print:m-0 print:bg-white print:min-h-0">
            <div className={`max-w-7xl mx-auto ${showReportModal ? 'print:hidden' : ''}`}>
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
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gray-100 transition-all text-[10px] uppercase tracking-widest"
                        >
                            <Download size={16} /> Generate Report
                        </button>
                        <button onClick={() => window.location.href = '/academic-staff/feedback'} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm">
                            View Feedback
                        </button>
                    </div>
                </div>

                {/* PROFILE CARD */}
                <Link to="/member/profile" className="block mb-10">
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-5 w-full">
                            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-3xl">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{user?.name || user?.full_name || 'Academic Staff'}</h3>
                                <p className="text-sm text-gray-500">{user?.role_name} • University of Kelaniya</p>
                            </div>
                        </div>
                        <div className="bg-teal-50 px-4 py-2 rounded-lg text-teal-700 text-xs font-bold whitespace-nowrap">
                            Senior Audit Executive
                        </div>
                    </div>
                </Link>

                {/* 1. FINANCIAL SUMMARY SECTION */}
                <section id="audit-summary" className="mb-12">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Account Oversight</h2>
                            <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-tighter font-bold">Real-time asset tracking</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Net Worth Card */}
                        <div className="bg-teal-700 p-6 rounded-2xl shadow-xl shadow-teal-100 text-white relative overflow-hidden group">
                            <TrendingUp className="absolute -right-2 -bottom-2 text-white/10 group-hover:scale-110 transition-transform" size={100} />
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-teal-100/60">Consolidated Fund</p>
                                <h3 className="text-2xl font-black mt-2 tracking-tight">
                                    Rs. {(financeData.accounts || []).reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0).toLocaleString()}
                                </h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">Audited Reserve</span>
                                </div>
                            </div>
                        </div>

                        {(financeData.accounts || []).map(acc => (
                            <div key={acc.account_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-teal-50 transition-colors">
                                            <CreditCard size={18} className="text-teal-600" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{acc.account_name}</p>
                                    <h3 className="text-xl font-bold mt-1 text-gray-900 tracking-tight">
                                        Rs. {Number(acc.current_balance).toLocaleString()}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. AUDIT REQUIREMENTS PANEL */}
                <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between mb-12 max-w-md">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold">Audit Requirements</h3>
                        <p className="text-[10px] text-teal-400/80 font-bold uppercase tracking-widest mt-1">Status Overview</p>
                        
                        <div className="mt-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400"><Clock size={18} /></div>
                                    <span className="text-sm font-medium text-gray-300">Awaiting Verification</span>
                                </div>
                                <span className="text-lg font-black">{financeData.transactions.filter(t => t.status === 'Pending').length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><FileText size={18} /></div>
                                    <span className="text-sm font-medium text-gray-300">Letter Requests</span>
                                </div>
                                <span className="text-lg font-black">{recRequests.filter(r => r.status === 'Pending').length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-white/5 relative z-10">
                        <button 
                            onClick={() => document.getElementById('audit-queue').scrollIntoView({ behavior: 'smooth' })}
                            className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                        >
                            Open Review Queue <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>

                {/* 3. TRANSACTION AUDIT QUEUE */}
                <section id="audit-queue" className="mb-16 scroll-mt-24">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-teal-600 rounded-full"></span> Transaction Audit Trail
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 px-4">Financial Accountability Feed</p>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
                            <select 
                                onChange={(e) => {
                                    setFilterType('Event');
                                    setFilterValue(e.target.value);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none border-0 text-gray-500 cursor-pointer"
                            >
                                <option value="">Filter by Event</option>
                                {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                            </select>
                            <div className="w-px h-4 bg-gray-100"></div>
                            <select 
                                onChange={(e) => {
                                    setFilterType('Account');
                                    setFilterValue(e.target.value);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none border-0 text-gray-500 cursor-pointer"
                            >
                                <option value="">Filter by Account</option>
                                {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                            </select>
                            {filterValue && (
                                <button onClick={() => {setFilterType('All'); setFilterValue('');}} className="p-1 px-3 text-[10px] font-black text-red-500 uppercase">Reset</button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-5">Transaction Details</th>
                                    <th className="px-6 py-5">Source & Origin</th>
                                    <th className="px-6 py-5">Verification Assets</th>
                                    <th className="px-6 py-5">Audit Status</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {filteredTransactions.map(t => (
                                    <tr key={t.transaction_id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="font-black text-gray-900">{t.description}</div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`text-xs font-black ${t.transaction_type === 'Income' ? 'text-teal-600' : 'text-red-500'}`}>
                                                    {t.transaction_type === 'Income' ? '+' : '-'} Rs. {Number(t.amount).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-300">•</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatDate(t.transaction_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                {t.event_name || 'General Operations'}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 px-3.5">
                                                {t.account_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <button 
                                                onClick={() => setSelectedEvidence(t)}
                                                className="group/btn relative flex flex-col gap-1.5"
                                            >
                                                {t.bill_proof_url ? (
                                                    <span className="bg-teal-50 text-teal-700 text-[9px] font-black uppercase px-3 py-1 rounded-md border border-teal-100 flex items-center gap-2 group-hover/btn:bg-teal-600 group-hover/btn:text-white transition-all">
                                                        <Search size={12} /> View Proof
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-[9px] font-bold uppercase italic flex items-center gap-1">
                                                        <X size={10} /> No Bill Proof
                                                    </span>
                                                )}
                                                {t.missing_proof_reason && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                        <FileText size={10} /> Note Attached
                                                    </div>
                                                )}
                                                <span className="text-[8px] text-teal-500 font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity uppercase">Click for details</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                t.status === 'Approved' ? 'bg-teal-600 text-white' :
                                                t.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.status === 'Pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApproveTransaction(t.transaction_id)}
                                                        className="bg-teal-600 hover:bg-teal-700 text-white p-1.5 rounded-lg transition-transform active:scale-90"
                                                        title="Approve"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectTransaction(t.transaction_id)}
                                                        className="bg-white border border-red-200 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-transform active:scale-90"
                                                        title="Reject"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">Finalized</span>
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

                    {/* Member List for Selected Skill */}
                    {selectedSkill && (
                        <div className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden animate-fade-in">
                            <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
                                <h3 className="font-bold text-teal-800 text-sm">Members skilled in: <span className="text-teal-600">{selectedSkill.name}</span></h3>
                                <button onClick={() => { setSelectedSkill(null); setSkillMembers([]); }} className="text-teal-400 hover:text-teal-700"><X size={16} /></button>
                            </div>
                            {skillMembersLoading ? (
                                <p className="text-center text-gray-400 text-sm py-8 italic animate-pulse">Scanning membership database...</p>
                            ) : skillMembers.length === 0 ? (
                                <p className="text-center text-gray-500 italic text-sm py-8">No formal expertise recorded in this area yet.</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {skillMembers.map((m) => (
                                        <div key={m.user_id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
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
                    <h2 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Recommendation Letter Requests</h2>
                    <div className="space-y-4">
                        {recRequests.length === 0 ? (
                            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm italic">
                                No pending recommendation requests assigned to you.
                            </div>
                        ) : recRequests.map(req => (
                            <div key={req.request_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner uppercase">
                                        {req.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 tracking-tight">{req.full_name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1 font-bold">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-widest">{req.student_number}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(req.requested_at)}</span>
                                            <span className={`px-2 py-0.5 rounded uppercase tracking-widest ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => navigate(`/academic-staff/recommendation-letter/${req.request_id}`)}
                                        className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Generate Letter
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteRequest(req.request_id)}
                                        className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                                        title="Delete Request"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Event Highlights Section */}
                <ScrollSection id="events" title="Institutional Events">
                    {allEvents.map(event => (
                        <div 
                            key={event.event_id} 
                            onClick={() => navigate(`/academic-staff/event/${event.event_id}`)} 
                            className="min-w-[340px] bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all snap-start cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${event.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {event.event_name?.substring(0, 2).toUpperCase() || 'EV'}
                                        </div>
                                        <h4 className="font-black text-gray-800 text-sm group-hover:text-teal-600 transition-colors">{event.event_name}</h4>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{event.status}</span>
                                </div>
                                <div className="space-y-4 mb-8 mt-6">
                                    <div className="flex gap-4 items-center"><Calendar size={16} className="text-gray-300" /><span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{formatDate(event.start_date)}</span></div>
                                    <div className="flex gap-4 items-center"><Users size={16} className="text-gray-300" /><span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{event.oc_count || 0} Committee Members</span></div>
                                    <div className="flex gap-4 items-center"><FileText size={16} className="text-gray-300" /><span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{event.task_count || 0} Total Tasks</span></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-teal-600 text-[10px] font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                                <span>Administrative Oversight</span><ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
                </ScrollSection>

            </div>
            {/* MODALS */}
            <BudgetReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                events={allEvents}
            />
            {/* MODAL: Evidence Detail */}
            {selectedEvidence && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-600/20 backdrop-blur-sm" onClick={() => setSelectedEvidence(null)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xs font-black text-teal-800 uppercase tracking-widest">Transaction Evidence</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Transaction ID: TXN-{selectedEvidence.transaction_id.toString().padStart(4, '0')}</p>
                            </div>
                            <button onClick={() => setSelectedEvidence(null)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400 shadow-sm border border-transparent hover:border-gray-100">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            {/* Summary Bit */}
                            <div className="flex justify-between items-center py-4 px-6 bg-teal-50 rounded-xl border border-teal-100">
                                <div>
                                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">Audit Amount</p>
                                    <p className="text-xl font-black text-teal-800">Rs. {Number(selectedEvidence.amount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Record Date</p>
                                    <p className="text-xs font-bold text-gray-600">{formatDate(selectedEvidence.transaction_date)}</p>
                                </div>
                            </div>

                            {/* Detailed Note */}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={14} className="text-teal-600" /> Junior Treasurer's Justification
                                </h4>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                                        {selectedEvidence.missing_proof_reason ? `"${selectedEvidence.missing_proof_reason}"` : "No specific notes provided for this transaction."}
                                    </p>
                                </div>
                            </div>

                            {/* Proof Section */}
                            {selectedEvidence.bill_proof_url ? (
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-teal-600" /> Uploaded Document
                                    </h4>
                                    <a 
                                        href={selectedEvidence.bill_proof_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-3 bg-teal-600 text-white rounded-xl py-4 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-teal-50 hover:bg-teal-700 transition-all active:scale-[0.98]"
                                    >
                                        <Search size={18} /> View High-Res Proof
                                    </a>
                                    {selectedEvidence.status === 'Pending' && (
                                        <div className="flex gap-3 mt-6">
                                            <button 
                                                onClick={() => {
                                                    const txId = selectedEvidence.transaction_id;
                                                    setSelectedEvidence(null);
                                                    handleApproveTransaction(txId);
                                                }}
                                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-50 transition-all"
                                            >
                                                Verify & Approve
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const txId = selectedEvidence.transaction_id;
                                                    setSelectedEvidence(null);
                                                    handleRejectTransaction(txId);
                                                }}
                                                className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-3 font-bold text-xs uppercase tracking-widest transition-all"
                                            >
                                                Reject with Reason
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                                            <X size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">No Proof Attached</p>
                                        </div>
                                    </div>
                                    {selectedEvidence.status === 'Pending' && (
                                        <div className="flex gap-3 mt-6">
                                            <button 
                                                onClick={() => {
                                                    const txId = selectedEvidence.transaction_id;
                                                    setSelectedEvidence(null);
                                                    handleApproveTransaction(txId);
                                                }}
                                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-50 transition-all"
                                            >
                                                Verify anyway
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const txId = selectedEvidence.transaction_id;
                                                    setSelectedEvidence(null);
                                                    handleRejectTransaction(txId);
                                                }}
                                                className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl py-3 font-bold text-xs uppercase tracking-widest transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">IMSSA Audit Protocol Compliance</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL: Reject Transaction */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-gray-600/30 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                            <div>
                                <h3 className="text-lg font-black text-red-700 tracking-tight flex items-center gap-2">
                                    <X className="bg-red-100 text-red-600 p-1 rounded-full" size={24} /> Reject Transaction
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit Rejection Notice</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Please provide a reason to the Junior Treasurer so they can correct the financing details and resubmit the transaction.</p>
                            
                            <div className="space-y-1 mt-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Rejection Reason</label>
                                <textarea 
                                    className="w-full border-2 border-red-100 rounded-xl p-3 text-sm focus:border-red-400 focus:ring-0 outline-none transition-colors h-24 resize-none font-medium text-gray-700 placeholder-gray-300"
                                    placeholder="E.g., The bill proof is blurry, please re-upload a clearer image."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex gap-3">
                            <button 
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 uppercase tracking-widest rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitRejection}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-bold text-xs shadow-md shadow-red-100 uppercase tracking-widest transition-all active:scale-[0.98]"
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeniorTreasurerDashboard;
