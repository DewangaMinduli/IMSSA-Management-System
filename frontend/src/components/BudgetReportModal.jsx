import React, { useState, useEffect } from 'react';
import { 
    X, TrendingUp, TrendingDown, 
    DollarSign, Printer, FileText, ChevronDown, Calendar, Search, 
    Plus
} from 'lucide-react';

const BudgetReportModal = ({ isOpen, onClose, events = [] }) => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        event_id: 'all'
    });

    useEffect(() => {
        if (isOpen) {
            handleGenerate();
        }
    }, [isOpen, filters.event_id]); 

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let url = `http://localhost:5000/api/finance/report-data?`;
            if (filters.start_date) url += `start_date=${filters.start_date}&`;
            if (filters.end_date) url += `end_date=${filters.end_date}&`;
            if (filters.event_id) url += `event_id=${filters.event_id}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (err) {
            console.error('Report fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-600/30 backdrop-blur-sm" onClick={onClose}></div>
            
            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-50">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-teal-800 uppercase tracking-tighter">Budget Statement</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">IMSSA Financial System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-50 hover:text-teal-700 transition-all active:scale-95"
                        >
                            <Printer size={14} /> Print Audit
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/20">
                    
                    {/* Filters Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-10 flex flex-wrap items-end gap-6 print:hidden">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Reporting Period</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                />
                                <span className="text-gray-300 font-bold px-1 italic">to</span>
                                <input 
                                    type="date" 
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="w-64">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Event Domain</label>
                            <div className="relative">
                                <select 
                                    value={filters.event_id}
                                    onChange={(e) => setFilters({...filters, event_id: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer pr-10"
                                >
                                    <option value="all">Consolidated Audit</option>
                                    {events.map(ev => (
                                        <option key={ev.event_id} value={ev.event_id}>{ev.event_name || ev.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-teal-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-50 hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Generate Statement'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregating Records...</p>
                        </div>
                    ) : reportData ? (
                        <div className="print:m-0">
                            
                            {/* PRINT HEADER */}
                            <div className="hidden print:block mb-10 text-center border-b border-gray-200 pb-10">
                                <h1 className="text-3xl font-black text-teal-800 tracking-tighter">FINANCIAL AUDIT STATEMENT</h1>
                                <p className="text-[10px] text-gray-400 mt-2 font-black tracking-[0.2em] uppercase">
                                    {filters.event_id === 'all' ? 'All Association Domain' : 'Event Limited Discovery'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest italic">
                                    Compiled on {new Date().toLocaleDateString()} • University of Kelaniya
                                </p>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-teal-500">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Total Verified Income</p>
                                    <h3 className="text-3xl font-black text-teal-600 truncate">Rs. {reportData.metrics.totalIncome.toLocaleString()}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-gray-400">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Total Verified Expense</p>
                                    <h3 className="text-3xl font-black text-gray-600 truncate">Rs. {reportData.metrics.totalExpense.toLocaleString()}</h3>
                                </div>
                                <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 shadow-inner">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-teal-600/60 mb-1">Audit Net Balance</p>
                                    <h3 className="text-3xl font-black text-teal-800 truncate">
                                        Rs. {reportData.metrics.netBalance.toLocaleString()}
                                    </h3>
                                </div>
                            </div>

                            {/* Journal Table */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-12">
                                <div className="px-8 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest">
                                        Verified Transaction Journal
                                    </div>
                                    <span className="text-[9px] font-black text-teal-600 bg-white px-3 py-1 rounded-full border border-teal-100">
                                        {reportData.transactions.length} Records Audited
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-50">
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nature</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {reportData.transactions.map((tx) => (
                                                <tr key={tx.transaction_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-8 py-4 text-[11px] font-bold text-gray-400 whitespace-nowrap">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                    <td className="px-8 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-gray-700">{tx.description}</span>
                                                            <span className="text-[9px] font-bold text-teal-600 uppercase mt-0.5">{tx.event_name || 'General Association'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-[11px] font-bold text-gray-400">{tx.account_name}</td>
                                                    <td className={`px-8 py-4 text-xs font-black text-right ${tx.transaction_type === 'Income' ? 'text-teal-600' : 'text-gray-600'}`}>
                                                        {tx.transaction_type === 'Income' ? '+' : '-'} {parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </td>
                                                </tr>
                                            ))}
                                            {reportData.transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-20 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">No verified data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-teal-800 text-white print:bg-gray-100 print:text-gray-800">
                                            <tr>
                                                <td colSpan="3" className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Statement Summary Total</td>
                                                <td className="px-8 py-5 text-xl font-black text-right border-l border-teal-700 print:border-gray-300">
                                                    {reportData.metrics.netBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* SIGNATURE SECTION */}
                            <div className="hidden print:flex justify-between mt-32 px-12 pb-10">
                                <div className="text-center">
                                    <div className="w-48 border-b border-gray-400 mb-2"></div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">Junior Treasurer</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-48 border-b border-gray-400 mb-2"></div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">Senior Treasurer</p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                            <Plus size={48} className="text-gray-100 mb-4" />
                            <h3 className="text-sm font-black text-gray-300 uppercase tracking-tighter">Record Aggregator</h3>
                            <p className="text-[10px] text-gray-300 mt-1 font-bold uppercase tracking-widest">Select domain and period to begin</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-400 tracking-widest print:hidden">
                    <p>SYSTEM CERTIFIED AUDIT Statement • {new Date().getFullYear()}</p>
                    <p className="text-teal-600">IMSSA FINANCIAL COMPLIANCE</p>
                </div>
            </div>
        </div>
    );
};

export default BudgetReportModal;
