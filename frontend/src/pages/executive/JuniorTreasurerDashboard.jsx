import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatDate, formatRelativeTime } from '../../utils/dateFormatter';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar,
    FileText, Plus, Upload, CreditCard, ChevronRight, AlertTriangle,
    Bell, Home, Users, Clock, Printer, Download, X, ArrowRight, Pencil, Trash2, RefreshCw
} from 'lucide-react';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';
import UserDropdown from '../../components/UserDropdown';
import BudgetReportModal from '../../components/BudgetReportModal';

const JuniorTreasurerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);

    // Reconciliation State
    const [isSyncing, setIsSyncing] = useState(null); // account object being synced
    const [actualBalance, setActualBalance] = useState('');

    const handleSyncSubmit = async () => {
        if (!actualBalance) return;
        const diff = parseFloat(actualBalance) - parseFloat(isSyncing.current_balance);
        if (diff === 0) {
            notify("Balances already match!");
            setIsSyncing(null);
            return;
        }

        const adjustmentTx = {
            description: `Bank Reconciliation Adjustment (${isSyncing.account_name})`,
            amount: Math.abs(diff),
            type: diff > 0 ? 'Income' : 'Expense',
            date: new Date().toISOString().split('T')[0],
            account_id: isSyncing.account_id,
            event_id: '',
            proof_url: '',
            notes: `Auto-generated to match bank statement balance of Rs. ${actualBalance}`
        };

        try {
            const res = await fetch('http://localhost:5000/api/finance/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...adjustmentTx, status: 'Approved' }) // Auto-approve adjustments
            });
            if (res.ok) {
                notify("Balance Synchronized!");
                fetchDashboardData();
                setIsSyncing(null);
                setActualBalance('');
            } else {
                notify("Sync failed", "error");
            }
        } catch (err) {
            notify("Network Error", "error");
        }
    };

    const [data, setData] = useState({
        accounts: [],
        transactions: [],
        events: []
    });

    // Task & Volunteer state
    const [tasksToApprove, setTasksToApprove] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [volunteerOps, setVolunteerOps] = useState([]);

    // Form State
    const [form, setForm] = useState({
        description: '', amount: '', type: 'Expense',
        date: new Date().toISOString().split('T')[0],
        account_id: '', event_id: '', proof_url: '', notes: ''
    });

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Global Notification
    const notify = useNotify();
    const { confirm } = useConfirm();

    // Filters
    const [filters, setFilters] = useState({ account_id: '', event_id: '' });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const uid = user?.id;
            
            // Construct query string for transactions
            let txUrl = 'http://localhost:5000/api/finance/transactions?';
            if (filters.account_id) txUrl += `account_id=${filters.account_id}&`;
            if (filters.event_id) txUrl += `event_id=${filters.event_id}&`;

            const [finRes, evRes, tasksRes, volRes, approveRes, txRes] = await Promise.all([
                fetch('http://localhost:5000/api/finance/dashboard-summary'),
                fetch('http://localhost:5000/api/events'),
                uid ? fetch(`http://localhost:5000/api/events/my-tasks?user_id=${uid}`) : Promise.resolve(null),
                uid ? fetch(`http://localhost:5000/api/events/volunteer-opportunities?exclude_user_id=${uid}&current_user_id=${uid}`) : Promise.resolve(null),
                uid ? fetch(`http://localhost:5000/api/events/tasks-to-approve?user_id=${uid}&role=exec`) : Promise.resolve(null),
                fetch(txUrl)
            ]);

            if (finRes && finRes.ok) {
                const json = await finRes.json();
                setData(prev => ({ 
                    ...prev, 
                    accounts: json.accounts || []
                }));
                if (json.accounts?.length > 0 && !form.account_id) {
                    setForm(prev => ({ ...prev, account_id: json.accounts[0].account_id }));
                }
            }
            if (txRes && txRes.ok) {
                const txData = await txRes.json();
                setData(prev => ({ ...prev, transactions: txData }));
            }
            if (evRes && evRes.ok) {
                const evData = await evRes.json();
                setData(prev => ({ ...prev, events: evData }));
            }
            if (tasksRes && tasksRes.ok) setMyTasks(await tasksRes.json());
            if (volRes && volRes.ok) setVolunteerOps(await volRes.json());
            if (approveRes && approveRes.ok) setTasksToApprove(await approveRes.json());
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
        
        // Listen for task approval from TaskDetails page and refresh
        window.addEventListener('taskApproved', fetchDashboardData);
        return () => window.removeEventListener('taskApproved', fetchDashboardData);
    }, [user, filters.account_id, filters.event_id]);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('overall');

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const calculateFilteredSummary = () => {
        let totalIncome = 0;
        let totalExpense = 0;
        data.transactions.forEach(tx => {
            const amt = parseFloat(tx.amount);
            if (tx.transaction_type === 'Income') totalIncome += amt;
            else totalExpense += amt;
        });
        return { totalIncome, totalExpense, net: totalIncome - totalExpense };
    };

    const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Client-side check for insufficient funds
        if (form.type === 'Expense') {
            const selectedAcc = data.accounts.find(a => a.account_id == form.account_id);
            if (selectedAcc && !isEditing && parseFloat(selectedAcc.current_balance) < parseFloat(form.amount)) {
                notify(`Insufficient funds in ${selectedAcc.account_name}`, 'error');
                return;
            }
        }

        try {
            const url = isEditing 
                ? `http://localhost:5000/api/finance/transaction/${editId}`
                : 'http://localhost:5000/api/finance/transaction';
            
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? form : { ...form, status: 'Pending' })
            });
            const resData = await res.json();
            if (res.ok) {
                notify(isEditing ? "Transaction Updated!" : "Transaction Recorded!");
                fetchDashboardData();
                resetForm();
            } else {
                notify(resData.message || "Action failed", 'error');
            }
        } catch (err) {
            notify("Network Error", 'error');
        }
    };

    const handleEdit = (tx) => {
        if (tx.status === 'Approved') {
            notify("This transaction has been approved and audited, and cannot be edited.", "error");
            return;
        }
        setForm({
            description: tx.description,
            amount: tx.amount,
            type: tx.transaction_type,
            date: new Date(tx.transaction_date).toISOString().split('T')[0],
            account_id: tx.account_id,
            event_id: tx.event_id || '',
            proof_url: tx.bill_proof_url || '',
            notes: tx.missing_proof_reason || ''
        });
        setEditId(tx.transaction_id);
        setIsEditing(true);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handleDelete = async (tx) => {
        if (tx.status === 'Approved') {
            notify("This transaction has been approved and audited, and cannot be deleted.", "error");
            return;
        }
        const ok = await confirm("Are you sure you want to delete this transaction? This action will permanently remove the record and adjust the corresponding account balance.");
        if (!ok) return;
        try {
            const res = await fetch(`http://localhost:5000/api/finance/transaction/${tx.transaction_id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                notify("Transaction successfully removed", "success");
                fetchDashboardData();
            } else {
                const data = await res.json();
                notify(data.message || "Failed to remove transaction", "error");
            }
        } catch (err) {
            notify("Connection error: Unable to reach server", "error");
        }
    };

    const resetForm = () => {
        setForm({
            description: '', amount: '', type: 'Expense',
            date: new Date().toISOString().split('T')[0],
            account_id: data.accounts[0]?.account_id || '', event_id: '', proof_url: '', notes: ''
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleApply = async (task) => {
        try {
            const uid = user?.id || user?.user_id;
            const res = await fetch(`http://localhost:5000/api/events/tasks/${task.id}/volunteer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: uid })
            });
            const data = await res.json();
            notify(res.ok ? `Volunteered for: ${task.title}!` : data.message, res.ok ? 'success' : 'error');
            
            if (res.ok) {
                setVolunteerOps(prev => prev.filter(op => op.id !== task.id));
                setMyTasks(prev => [...prev, { ...task, status: 'Assigned' }]);
            }
        } catch (err) {
            notify('Failed to volunteer', 'error');
        }
        setSelectedVolunteerTask(null);
    };



    const handleGenerateReport = () => {
        notify(`Generating ${reportType.toUpperCase()} Report...`, "success");
        setShowReportModal(false);
    };

    // Helper for Horizontal Scrolling Sections
    const ScrollSection = ({ id, title, children }) => (
        <div id={id} className="mb-8 scroll-mt-24">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <button className="text-teal-600 text-xs font-semibold hover:underline">View All</button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                {children}
            </div>
        </div>
    );

    if (!user) return <div className="p-8">Redirecting...</div>;

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans relative px-8 mt-10 print:p-0 print:m-0 print:bg-white print:min-h-0">
            <div className={`max-w-7xl mx-auto ${showReportModal ? 'print:hidden' : ''}`}>

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
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gray-100 transition-all text-[10px] uppercase tracking-widest"
                        >
                            <Download size={16} /> Generate Report
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
                        <div
                            onClick={() => navigate('/member/profile')}
                            className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl cursor-pointer hover:bg-orange-200 transition-colors"
                        >
                            {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'J'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{user?.full_name || user?.name || 'Junior Treasurer'}</h3>
                            <p className="text-sm text-gray-500 mb-3">{user?.student_no || ''}{user?.student_no ? ' • ' : ''}Junior Treasurer</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/member/feedback')} className="bg-teal-100/50 text-teal-700 hover:bg-teal-100 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                        Feedback
                    </button>
                </div>

                {/* 4. FINANCIAL OVERVIEW (Accounts) */}
                <section id="financial-overview" className="mb-10 scroll-mt-24">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Financial Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Net Worth Card */}
                        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-2xl shadow-xl shadow-teal-100 text-white border-0 flex flex-col justify-between relative overflow-hidden h-full group transition-all hover:scale-[1.02]">
                            <TrendingUp className="absolute -right-2 -bottom-2 text-white/10 opacity-20 group-hover:scale-110 transition-transform duration-500" size={100} />
                            <div className="relative z-10">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-teal-100/80">Total Net Worth</p>
                                <h3 className="text-2xl font-black mt-2">
                                    Rs. {data.accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {data.accounts.map(acc => (
                            <div key={acc.account_id} className="depth-card p-6 flex flex-col justify-between relative overflow-hidden group h-full">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CreditCard size={40} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{acc.account_name}</p>
                                    <h3 className={`text-xl font-bold mt-1.5 ${Number(acc.current_balance) < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                        Rs. {Number(acc.current_balance).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="mt-5 flex items-center justify-between">
                                    <button 
                                        onClick={() => setIsSyncing(acc)}
                                        className="text-[9px] font-bold text-teal-600 hover:text-teal-700 uppercase bg-teal-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all btn-push"
                                    >
                                        <RefreshCw size={10} /> Sync with Bank
                                    </button>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. TRANSACTIONS & RECORDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Transaction List with Filters */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="depth-card p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                                <div>
                                    <h2 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Audit Log</h2>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Transactions</h3>
                                </div>
                                
                                {/* Filter Controls */}
                                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                    <select 
                                        name="account_id" 
                                        value={filters.account_id} 
                                        onChange={handleFilterChange}
                                        className="text-xs border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50 font-bold text-slate-700 transition-all cursor-pointer"
                                    >
                                        <option value="">All Accounts</option>
                                        {data.accounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                                    </select>
                                    <select 
                                        name="event_id" 
                                        value={filters.event_id} 
                                        onChange={handleFilterChange}
                                        className="text-xs border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50 font-bold text-slate-700 transition-all cursor-pointer"
                                    >
                                        <option value="">All Events</option>
                                        {data.events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Live Summary Bar */}
                            {data.transactions.length > 0 && (
                                <div className="grid grid-cols-3 gap-6 mb-10 p-6 bg-slate-50/80 rounded-2xl border border-slate-100 backdrop-blur-sm">
                                    <div className="text-center border-r border-slate-200">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Total In</p>
                                        <p className="text-lg font-black text-emerald-600">Rs. {calculateFilteredSummary().totalIncome.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center border-r border-slate-200">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Total Out</p>
                                        <p className="text-lg font-black text-rose-500">Rs. {calculateFilteredSummary().totalExpense.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Net Flow</p>
                                        <p className={`text-lg font-black ${calculateFilteredSummary().net >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                                            Rs. {calculateFilteredSummary().net.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-2 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 uppercase font-bold text-[10px] tracking-widest">
                                        <tr>
                                            <th className="p-4 rounded-l-lg">Date</th>
                                            <th className="p-4">Description / Event</th>
                                            <th className="p-4 text-right rounded-r-lg">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-10 text-center text-gray-400 italic">No transactions found for these filters.</td>
                                            </tr>
                                        ) : data.transactions.map(tx => (
                                            <tr key={tx.transaction_id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4 text-gray-500 text-xs">{formatDate(tx.transaction_date)}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-800">{tx.description}</div>
                                                    <div className="text-[10px] text-blue-500 font-medium uppercase mt-0.5">{tx.event_name || 'General Association'} • {tx.account_name}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className={`font-black ${tx.transaction_type === 'Income' ? 'text-teal-600' : 'text-red-500'}`}>
                                                        {tx.transaction_type === 'Income' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                                    </div>
                                                    <div className="flex justify-end mt-1">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                            tx.status === 'Approved' ? 'bg-teal-100 text-teal-700' :
                                                            tx.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-600'
                                                        }`}>
                                                            {tx.status}
                                                        </span>
                                                    </div>
                                                    {tx.status === 'Rejected' && tx.missing_proof_reason && (
                                                        <div className="text-[9px] text-red-400 italic mt-1 font-bold text-right max-w-[200px] ml-auto">
                                                            Reason: {tx.missing_proof_reason}
                                                        </div>
                                                    )}
                                                    {tx.status !== 'Approved' && (
                                                        <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button 
                                                                onClick={() => handleEdit(tx)}
                                                                className="p-1.5 bg-gray-50 text-blue-500 hover:bg-blue-100 rounded transition"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(tx)}
                                                                className="p-1.5 bg-gray-50 text-red-500 hover:bg-red-100 rounded transition"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Quick Record Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
                        <h2 className={`text-lg font-bold mb-6 flex items-center justify-between border-b border-gray-50 pb-4 ${isEditing ? 'text-blue-700' : 'text-gray-700'}`}>
                            <div className="flex items-center gap-2">
                                <Plus className={`${isEditing ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'} rounded p-1`} size={24} /> 
                                {isEditing ? 'Edit Record' : 'Records'}
                            </div>
                            {isEditing && (
                                <button onClick={resetForm} className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors">
                                    Cancel
                                </button>
                            )}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Description</label>
                                <input type="text" name="description" value={form.description} onChange={handleInputChange} placeholder="E.g., Catering for Workshop" required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Amount (Rs.)</label>
                                    <input type="number" name="amount" value={form.amount} onChange={handleInputChange} placeholder="0.00" required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Date</label>
                                    <input type="date" name="date" value={form.date} onChange={handleInputChange} required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Type</label>
                                    <select name="type" value={form.type} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 bg-white shadow-sm font-medium">
                                        <option value="Expense">Expense</option>
                                        <option value="Income">Income</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Account</label>
                                    <select name="account_id" value={form.account_id} onChange={handleInputChange} required className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 bg-white shadow-sm font-medium text-teal-700">
                                        <option value="">Select...</option>
                                        {data.accounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Related Event (Optional)</label>
                                <select name="event_id" value={form.event_id} onChange={handleInputChange} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 bg-white shadow-sm font-medium text-blue-700">
                                    <option value="">No Specific Event</option>
                                    {data.events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Bill Proof URL</label>
                                <input 
                                    type="text" 
                                    name="proof_url" 
                                    value={form.proof_url} 
                                    onChange={handleInputChange} 
                                    placeholder="Link to external proof (GDrive/Imgur)..." 
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm" 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Notes / File Ref</label>
                                <textarea name="notes" value={form.notes} onChange={handleInputChange} placeholder="Additional details..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm h-20 resize-none font-sans" />
                            </div>

                            <button type="submit" className={`w-full text-white py-3 rounded-xl font-black transition-all shadow-lg active:scale-95 text-xs tracking-widest uppercase mt-4 ${
                                isEditing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-100'
                            }`}>
                                {isEditing ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 6. TASKS TO APPROVE */}
                <ScrollSection id="approve-tasks" title="Tasks to Approve">
                    {tasksToApprove.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No tasks requiring approval.
                        </div>
                    ) : tasksToApprove.map(task => (
                        <div 
                            key={task.assignment_id} 
                            onClick={() => navigate(`/exec/tasks/${task.id}/${task.assignment_id}`)}
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
                                <div className="text-xs text-gray-500 mb-2"><strong>Event:</strong> {task.event}</div>
                                <div className="text-xs text-gray-500 mb-4"><strong>By:</strong> {task.assigned_to}</div>
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-50">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/exec/tasks/${task.id}/${task.assignment_id}?mode=review`);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Review
                                </button>
                            </div>
                        </div>
                    ))}
                </ScrollSection>

                {/* 7. MY TASKS */}
                <ScrollSection id="my-tasks" title="My Tasks">
                    {myTasks.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => navigate(`/exec/tasks/${task.id}/${task.assignment_id}`)}
                            className="min-w-[320px] bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col snap-start"
                        >
                            <h4 className="font-bold text-gray-800 text-sm mb-2">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{task.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <Clock size={14} /> Due: {new Date(task.due).toLocaleDateString()}
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

                {/* 8. VOLUNTEER OPPORTUNITIES */}
                <ScrollSection id="volunteer-opportunities" title="Volunteer Opportunities">
                    {volunteerOps.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No volunteer opportunities at this time.
                        </div>
                    ) : volunteerOps.map(op => {
                        const isFull = op.is_full === true;
                        const volunteerCount = op.volunteer_count || 0;
                        const maxVolunteers = op.max_volunteers || 5;
                        
                        return (
                            <div key={op.id} onClick={() => setSelectedVolunteerTask(op)} className={`min-w-[320px] bg-white p-5 rounded-xl border flex flex-col hover:shadow-md transition-all snap-start cursor-pointer group ${isFull ? 'border-gray-200 opacity-75' : 'border-gray-100 shadow-sm'}`}>
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
                                
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {formatDate(op.due)}</div>
                                <div className="mb-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${op.color}`}>Event: {op.event}</span></div>
                                <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center text-gray-500 group-hover:text-teal-600">
                                    <span className="text-xs font-medium">Click to View</span><ChevronRight size={14} />
                                </div>
                            </div>
                        );
                    })}
                </ScrollSection>

                {/* 9. EVENTS (Live from DB) */}
                <ScrollSection id="events" title="Events">
                    {data.events.length === 0 ? (
                        <div className="w-full min-w-[300px] text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400 snap-start">
                            No events found.
                        </div>
                    ) : data.events.map(event => (
                        <div 
                            key={event.event_id} 
                            onClick={() => navigate(`/exec/event/${event.event_id}`)} 
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
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{formatDate(event.start_date)}</span></div>
                                <div className="flex gap-3"><Users size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.oc_count || 0} Committee Members</span></div>
                                <div className="flex gap-3"><FileText size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{event.task_count || 0} Tasks</span></div>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-blue-600 text-xs font-bold cursor-pointer hover:text-blue-700">
                                <span>View Details</span><ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
                </ScrollSection>
            </div>

            {/* MODAL: Volunteer Task */}
            <VolunteerTaskModal
                isOpen={!!selectedVolunteerTask}
                task={selectedVolunteerTask}
                onClose={() => setSelectedVolunteerTask(null)}
                onApply={handleApply}
            />


            {/* 7. SYNC WITH BANK MODAL */}
            {isSyncing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Sync Balance</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">{isSyncing.account_name}</p>
                            </div>
                            <button onClick={() => setIsSyncing(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-teal-50 rounded-xl p-4 mb-8">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-teal-600/70 uppercase tracking-wider">System Balance</span>
                                <span className="text-[10px] font-bold text-teal-600/70 uppercase tracking-wider">Difference</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-teal-800">Rs. {Number(isSyncing.current_balance).toLocaleString()}</span>
                                <span className={`text-[10px] font-black ${actualBalance && (parseFloat(actualBalance) - parseFloat(isSyncing.current_balance)) !== 0 ? 'text-orange-600' : 'text-teal-600'}`}>
                                    {actualBalance ? `Rs. ${(parseFloat(actualBalance) - parseFloat(isSyncing.current_balance)).toLocaleString()}` : 'Rs. 0'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Actual Bank Statement Balance</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-3.5 text-gray-400 text-sm font-bold">Rs.</div>
                                    <input 
                                        type="number" 
                                        value={actualBalance} 
                                        onChange={(e) => setActualBalance(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3.5 text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder-gray-300" 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic px-1">
                                Notice: The system will automatically create an "Adjustment" transaction to bridge the gap between your statement and the system records.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsSyncing(null)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSyncSubmit}
                                disabled={!actualBalance}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-100 transition-all disabled:opacity-50 disabled:bg-gray-400"
                            >
                                Update Balance
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODALS */}
            <BudgetReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                events={data.events}
            />
        </div>
    );
};

export default JuniorTreasurerDashboard;
