import React, { useState, useEffect } from 'react';
import { 
    X, TrendingUp, TrendingDown, 
    DollarSign, Printer, FileText, ChevronDown, Calendar, Search, 
    Plus
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:static print:p-0 print:block">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-600/30 backdrop-blur-sm print:hidden" onClick={onClose}></div>
            
            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] print:max-h-none rounded-2xl shadow-xl overflow-hidden print:overflow-visible print:shadow-none print:w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 print:hidden">
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
                <div className="flex-1 overflow-y-auto print:overflow-visible p-8 print:p-0 bg-gray-50/20 print:bg-white">
                    
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
                        <div className="print:m-0 print:text-black w-full" id="budget-report-print-target">
                            
                            {/* PRINT HEADER */}
                            <div className="hidden print:block mb-10 pb-6 border-b-2 border-gray-100">
                                <div className="text-center mb-6">
                                    <p className="text-[10px] text-gray-600 font-bold mb-1">IMSSA Management System</p>
                                    <h1 className="text-4xl font-black text-teal-800 tracking-tighter uppercase">BUDGET REPORT</h1>
                                    <p className="text-[11px] font-black tracking-[0.1em] text-gray-800 mt-2 uppercase">
                                        {filters.event_id === 'all' 
                                            ? 'CONSOLIDATED ASSOCIATION DOMAIN' 
                                            : ((events.find(e => String(e.event_id) === String(filters.event_id))?.event_name || events.find(e => String(e.event_id) === String(filters.event_id))?.title) || 'EVENT DOMAIN IN FOCUS')}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase mt-1">
                                        {filters.start_date && filters.end_date ? `PERIOD: ${formatDate(filters.start_date)} TO ${formatDate(filters.end_date)}` : 'FULL ACADEMIC TERM (CUMULATIVE)'}
                                    </p>
                                </div>
                                
                                <div className="flex justify-between items-end mt-8">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase leading-none mb-1">COMPILER</p>
                                        <p className="text-[10px] font-black uppercase text-black">
                                            {window.location.pathname.includes('senior-treasurer') ? 'SENIOR TREASURER' : 'JUNIOR TREASURER'} • IMSSA
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase italic">
                                            GENERATED ON {formatDate(new Date())} • UNIVERSITY OF KELANIYA
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 gap-4 mb-10 print:mb-8 print:grid-cols-1">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:rounded-2xl print:border-gray-300 print:shadow-none">
                                    <p className="text-[11px] uppercase font-black tracking-widest text-gray-500 mb-2">Total Verified Income</p>
                                    <h3 className="text-3xl font-black text-black">Rs. {reportData.metrics.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 0})}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm print:rounded-2xl print:border-gray-300 print:shadow-none">
                                    <p className="text-[11px] uppercase font-black tracking-widest text-gray-500 mb-2">Total Verified Expense</p>
                                    <h3 className="text-3xl font-black text-black">Rs. {reportData.metrics.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 0})}</h3>
                                </div>
                                <div className="bg-teal-50 p-6 rounded-xl border border-teal-100 print:rounded-2xl print:border-2 print:border-black print:bg-white print:shadow-none">
                                    <p className="text-[11px] uppercase font-black tracking-widest text-teal-500 mb-2 print:text-teal-400">Audit Net Balance</p>
                                    <h3 className="text-3xl font-black text-black">
                                        Rs. {reportData.metrics.netBalance.toLocaleString(undefined, {minimumFractionDigits: 0})}
                                    </h3>
                                </div>
                            </div>

                            {/* Journal Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8 print:rounded-2xl print:border-gray-100 print:shadow-none">
                                <div className="px-8 py-5 flex justify-between items-center print:border-b-0">
                                    <div className="text-black font-black text-[12px] uppercase tracking-widest">
                                        Verified Transaction Journal
                                    </div>
                                    <span className="text-[9px] font-black text-teal-600 border border-teal-100 px-3 py-1 rounded-full">
                                        {reportData.transactions.length} Records Audited
                                    </span>
                                </div>
                                <div className="overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-black print:border-black">
                                                <th className="px-8 py-4 text-[11px] font-black text-black uppercase tracking-widest">Date</th>
                                                <th className="px-8 py-4 text-[11px] font-black text-black uppercase tracking-widest">Nature</th>
                                                <th className="px-8 py-4 text-[11px] font-black text-black uppercase tracking-widest">Account</th>
                                                <th className="px-8 py-4 text-[11px] font-black text-black uppercase tracking-widest text-right">Amount (LKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 print:divide-white">
                                            {reportData.transactions.map((tx) => (
                                                <tr key={tx.transaction_id} className="print:hover:bg-transparent">
                                                    <td className="px-8 py-5 text-[12px] font-black text-black whitespace-nowrap align-top">{formatDate(tx.transaction_date)}</td>
                                                    <td className="px-8 py-5 align-top">
                                                        <div className="flex flex-col">
                                                            <span className="text-[12px] font-black text-black">{tx.description}</span>
                                                            {filters.event_id === 'all' && (
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">{tx.event_name || 'General Association'}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-[12px] font-black text-black align-top">{tx.account_name}</td>
                                                    <td className="px-8 py-5 text-[12px] font-black text-black text-right align-top">
                                                        {tx.transaction_type === 'Income' ? '+' : '-'} {parseFloat(tx.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </td>
                                                </tr>
                                            ))}
                                            {reportData.transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-10 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">No verified data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t-[8px] border-black print:border-black bg-white flex justify-between items-center px-8 py-6">
                                    <div className="text-[12px] font-black text-black uppercase tracking-[0.2em]">Total Verified Statement Balance</div>
                                    <div className="text-3xl font-black text-black">
                                       Rs. {reportData.metrics.netBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </div>
                                </div>
                            </div>

                            {/* PENDING APPROVALS NOTE (Auditor Statement Note) */}
                            <div className="flex mb-12 px-6 py-5 bg-white rounded-2xl border border-gray-200 items-start gap-4 shadow-sm">
                                <Search size={24} className="text-black shrink-0 mt-1" />
                                <div>
                                    <p className="text-[12px] font-black text-black uppercase tracking-widest mb-2">Auditor Statement Note</p>
                                    <p className="text-[12px] text-gray-600 font-bold leading-relaxed">
                                        This report currently reflects only **Verified** transactions. 
                                        {reportData.metrics.pendingCount > 0 ? (
                                            <> There are currently <span className="text-black font-black">{reportData.metrics.pendingCount} transactions</span> (Totaling Rs. {(reportData.metrics.pendingIncome + reportData.metrics.pendingExpense).toLocaleString()}) awaiting approval from the Senior Treasurer which are excluded from these totals.</>
                                        ) : (
                                            " All recorded transactions for this period have been successfully verified."
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* SIGNATURE SECTION */}
                            <div className="flex justify-between mt-16 px-16 pb-10">
                                <div className="text-center w-64">
                                    <div className="w-full border-b-[3px] border-black mb-4"></div>
                                    <p className="text-[12px] font-black text-black uppercase tracking-widest">JUNIOR TREASURER</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-2 text-left">NAME: __________________________</p>
                                </div>
                                <div className="text-center w-64">
                                    <div className="w-full border-b-[3px] border-black mb-4"></div>
                                    <p className="text-[12px] font-black text-black uppercase tracking-widest">SENIOR TREASURER</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-2 text-left">NAME: __________________________</p>
                                </div>
                            </div>

                            {/* Global Custom Footer for print */}
                            <div className="text-center mt-12 pb-8">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Industrial Management Science Students' Association
                                </p>
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
