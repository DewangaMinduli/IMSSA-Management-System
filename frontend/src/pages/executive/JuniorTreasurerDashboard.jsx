import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    DollarSign, TrendingUp, TrendingDown, Calendar,
    FileText, Plus, Upload, CreditCard, ChevronRight, AlertTriangle,
    Bell, Home, Users, Clock, Printer, Download, X, ArrowRight
} from 'lucide-react';
import VolunteerTaskModal from '../../components/VolunteerTaskModal';
import UserDropdown from '../../components/UserDropdown';

const JuniorTreasurerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedVolunteerTask, setSelectedVolunteerTask] = useState(null);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('overall');

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
        description: '',
        amount: '',
        type: 'Expense',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        event_id: '',
        notes: ''
    });

    const fetchDashboardData = async () => {
        try {
            const uid = user?.id;
            const [finRes, evRes, tasksRes, volRes, approveRes] = await Promise.all([
                fetch('http://localhost:5000/api/finance/dashboard-summary'),
                fetch('http://localhost:5000/api/events'),
                uid ? fetch(`http://localhost:5000/api/events/my-tasks?user_id=${uid}`) : Promise.resolve(null),
                uid ? fetch(`http://localhost:5000/api/events/volunteer-opportunities?exclude_user_id=${uid}&current_user_id=${uid}`) : Promise.resolve(null),
                uid ? fetch(`http://localhost:5000/api/events/tasks-to-approve?user_id=${uid}&role=exec`) : Promise.resolve(null)
            ]);

            if (finRes && finRes.ok) {
                const json = await finRes.json();
                setData(prev => ({ 
                    ...prev, 
                    accounts: json.accounts || [], 
                    transactions: json.transactions || [] 
                }));
                if (json.accounts?.length > 0) {
                    setForm(prev => ({ ...prev, account_id: json.accounts[0].account_id }));
                }
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
    }, [user]);

    const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/finance/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert("Transaction Recorded!");
                fetchDashboardData();
                setForm({
                    description: '', amount: '', type: 'Expense',
                    date: new Date().toISOString().split('T')[0],
                    account_id: data.accounts[0]?.account_id || '', event_id: '', notes: ''
                });
            } else {
                alert("Failed to record transaction");
            }
        } catch (err) {
            console.error(err);
        }
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
            alert(res.ok ? `Volunteered for: ${task.title}!` : data.message);
            
            if (res.ok) {
                setVolunteerOps(prev => prev.filter(op => op.id !== task.id));
                setMyTasks(prev => [...prev, { ...task, status: 'Assigned' }]);
            }
        } catch (err) {
            alert('Failed to volunteer. Try again.');
        }
        setSelectedVolunteerTask(null);
    };



    const handleGenerateReport = () => {
        alert(`Generating ${reportType.toUpperCase()} Report...`);
        setShowReportModal(false);
    };

    // Helper for Horizontal Scrolling Sections
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

    if (!user) return <div className="p-8">Redirecting...</div>;

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans">

            {/* 1. HEADER */}
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
                    <Home size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">Junior Treasurer</div>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">

                {/* BACK ARROW + GREETING (inline) & ACTION BUTTONS */}
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
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-all text-xs"
                        >
                            <Printer size={16} /> Generate Report
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
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Financial Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Forcing Main and Event Accounts as requested if data is empty or generic */}
                        {data.accounts.length > 0 ? data.accounts.map(acc => (
                            <div key={acc.account_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                    <CreditCard size={60} className="text-teal-600" />
                                </div>
                                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{acc.account_name}</p>
                                <h3 className="text-3xl font-bold text-gray-800 mt-2">Rs. {Number(acc.current_balance).toLocaleString()}</h3>
                            </div>
                        )) : (
                            <>
                                {/* Fallback if DB empty, ensuring layout is visible */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Main Account</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-2">Rs. 1,250,000</h3>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Event Account</p>
                                    <h3 className="text-3xl font-bold text-gray-800 mt-2">Rs. 750,000</h3>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* 5. TRANSACTIONS & RECORDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Transaction List - RENAMED from 'Recent Transactions' to 'Transactions' */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-700">Transactions</h2>
                            <button className="text-teal-600 text-sm font-medium hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.transactions.slice(0, 5).map(tx => (
                                        <tr key={tx.transaction_id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="p-3 text-gray-600">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                            <td className="p-3 font-medium text-gray-800">{tx.description}</td>
                                            <td className={`p-3 text-right font-bold ${tx.transaction_type === 'Income' ? 'text-green-600' : 'text-red-500'}`}>
                                                {tx.transaction_type === 'Income' ? '+' : '-'} {Number(tx.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Record Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24">
                        <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                            <Plus className="bg-teal-100 text-teal-600 rounded p-1" size={24} /> Records
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Notes / File Ref</label>
                                <textarea name="notes" value={form.notes} onChange={handleInputChange} placeholder="Additional details..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 shadow-sm h-20 resize-none font-sans" />
                            </div>

                            <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-xl font-black hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 active:scale-95 text-xs tracking-widest uppercase mt-4">
                                SAVE TRANSACTION
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
                                        navigate(`/exec/tasks/${task.id}/${task.assignment_id}`);
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
                                
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><Clock size={14} /> Due: {op.due}</div>
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
                                <div className="flex gap-3"><Calendar size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span></div>
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

            {/* MODAL: Report Generation */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Generate Report</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Select the type of report you want to generate:</p>

                            <div className="space-y-3">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reportType === 'overall' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-200'}`}>
                                    <input type="radio" name="reportType" value="overall" checked={reportType === 'overall'} onChange={() => setReportType('overall')} className="text-teal-600 focus:ring-teal-500" />
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">Overall Budget Report</span>
                                        <span className="block text-xs text-gray-500">Complete analysis of all accounts and events</span>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reportType === 'event' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-200'}`}>
                                    <input type="radio" name="reportType" value="event" checked={reportType === 'event'} onChange={() => setReportType('event')} className="text-teal-600 focus:ring-teal-500" />
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">Event Specific Report</span>
                                        <span className="block text-xs text-gray-500">Detailed expenses for a selected event</span>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reportType === 'account' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-200'}`}>
                                    <input type="radio" name="reportType" value="account" checked={reportType === 'account'} onChange={() => setReportType('account')} className="text-teal-600 focus:ring-teal-500" />
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">Account Statement</span>
                                        <span className="block text-xs text-gray-500">Transaction history for a specific account</span>
                                    </div>
                                </label>
                            </div>

                            {reportType === 'event' && (
                                <select className="w-full mt-2 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 bg-gray-50">
                                    <option>Select Event...</option>
                                    {data.events.map(e => <option key={e.event_id}>{e.event_name}</option>)}
                                </select>
                            )}
                            {reportType === 'account' && (
                                <select className="w-full mt-2 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 bg-gray-50">
                                    <option>Select Account...</option>
                                    {data.accounts.map(a => <option key={a.account_id}>{a.account_name}</option>)}
                                </select>
                            )}

                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={handleGenerateReport} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
                                <Download size={16} /> Generate PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JuniorTreasurerDashboard;
