import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Search, User, UserPlus, Bell, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import UserDropdown from '../../components/UserDropdown';

const NominateTerm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const notify = useNotify();
    const [loading, setLoading] = useState(false);

    // Initial board with mandatory roles
    const [board, setBoard] = useState([
        { roleName: 'President', systemRole: 'President', name: '', studentId: '' },
        { roleName: 'Vice President', systemRole: 'Executive_Board', name: '', studentId: '' },
        { roleName: 'Secretary', systemRole: 'Executive_Board', name: '', studentId: '' },
        { roleName: 'Junior Treasurer', systemRole: 'Junior_Treasurer', name: '', studentId: '' },
        { roleName: 'Media Director', systemRole: 'Executive_Board', name: '', studentId: '' }
    ]);

    const handleAddAssignment = () => {
        setBoard([...board, { roleName: '', systemRole: 'Executive_Board', name: '', studentId: '' }]);
    };

    const handleRemoveAssignment = (index) => {
        if (index < 5) return; // Prevent removing mandatory roles
        const newBoard = board.filter((_, i) => i !== index);
        setBoard(newBoard);
    };

    const updateNominee = (index, field, value) => {
        const newBoard = [...board];
        newBoard[index][field] = value;
        setBoard(newBoard);
    };

    const handleEndTerm = async () => {
        // Validation: Ensure all assigned roles have IDs
        const incomplete = board.some(n => n.roleName && (!n.name || !n.studentId));
        if (incomplete) {
            notify("Please complete all assignments with Name and Student ID before ending the term.", "error");
            return;
        }

        const confirmMsg = "Are you sure you want to END the current term?\n\n" +
            "• Graduating Level 4 students will be archived.\n" +
            "• Underclassmen will be promoted to the next level.\n" +
            "• Existing roles will be set to 'Past'.\n" +
            "• New board will be officially assigned.\n\n" +
            "This action is irreversible. Proceed?";

        if (window.confirm(confirmMsg)) {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:5000/api/users/rollover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nominations: board })
                });

                if (res.ok) {
                    notify("Term Handover Successful! The system has transitioned to the new term.", "success");
                    navigate('/login');
                } else {
                    const data = await res.json();
                    notify("Failed to end term: " + data.message, "error");
                }
            } catch (err) {
                console.error("Rollover error", err);
                notify("Server Error during Term Rollover.", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    // --- Search Suggestion Component ---
    const StudentSearch = ({ index, field, value, placeholder }) => {
        const [suggestions, setSuggestions] = useState([]);
        const [showDropdown, setShowDropdown] = useState(false);
        const dropdownRef = useRef(null);

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setShowDropdown(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const fetchSuggestions = async (val) => {
            if (val.length < 2) {
                setSuggestions([]);
                setShowDropdown(false);
                return;
            }
            try {
                const res = await fetch(`http://localhost:5000/api/users/search?q=${val}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                    setShowDropdown(data.length > 0);
                }
            } catch (err) {
                console.error("Search error", err);
            }
        };

        const handleSelect = (student) => {
            updateNominee(index, 'name', student.full_name);
            updateNominee(index, 'studentId', student.student_number);
            setShowDropdown(false);
        };

        return (
            <div className="relative w-full" ref={dropdownRef}>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300 transition-colors"
                    value={value}
                    onChange={(e) => {
                        updateNominee(index, field, e.target.value);
                        fetchSuggestions(e.target.value);
                    }}
                    onFocus={() => value.length >= 2 && setShowDropdown(true)}
                />
                {showDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
                        {suggestions.map((s) => (
                            <div
                                key={s.user_id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                                onClick={() => handleSelect(s)}
                            >
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                                    <User size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{s.full_name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{s.student_number} • {s.role_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Helper for navigation
    const navigateBack = () => {
        if (user?.role_name === 'President') navigate('/exec/president-dashboard');
        else if (user?.role_name === 'Junior_Treasurer') navigate('/exec/junior-treasurer-dashboard');
        else navigate('/exec/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* MATCH HOME PAGE HEADER (President style) */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs">IM</div>
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
                    <Home size={20} className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors" onClick={() => navigateBack()} />
                    <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">{user?.role_name || 'Executive'}</div>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-50 pb-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={navigateBack} 
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors transform rotate-180"
                            >
                                <ArrowRight size={22} />
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Assign Next Term (2025/26)</h2>
                        </div>
                        <button 
                            type="button"
                            onClick={handleAddAssignment}
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-teal-600 transition-all flex items-center gap-2 group"
                        >
                            <Plus size={16} />
                            Add Assignment
                        </button>
                    </div>

                    <div className="space-y-10">
                        {board.map((nomination, index) => (
                            <div key={index} className={`grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6 items-end p-4 rounded-xl ${index < 5 ? 'bg-white' : 'bg-gray-50'}`}>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Role</label>
                                    <input
                                        type="text"
                                        placeholder="Role Name"
                                        className={`w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 font-semibold transition-all bg-transparent`}
                                        value={nomination.roleName}
                                        onChange={(e) => updateNominee(index, 'roleName', e.target.value)}
                                        readOnly={index < 5}
                                    />
                                </div>

                                <div className="md:col-span-1 border-b border-gray-100 md:border-0">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Name</label>
                                    <StudentSearch 
                                        index={index} 
                                        field="name" 
                                        value={nomination.name} 
                                        placeholder="Assignee Name" 
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Student ID</label>
                                    <StudentSearch 
                                        index={index} 
                                        field="studentId" 
                                        value={nomination.studentId} 
                                        placeholder="IM/XXXX/XXX" 
                                    />
                                </div>

                                <div className="flex justify-end">
                                    {index >= 5 && (
                                        <button 
                                            onClick={() => handleRemoveAssignment(index)}
                                            className="p-2 text-red-300 hover:text-red-500 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t border-gray-100 flex justify-center">
                        <div className="flex gap-4">
                            <button 
                                onClick={navigateBack}
                                className="px-8 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEndTerm}
                                disabled={loading}
                                className={`px-12 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
                            >
                                {loading ? 'Processing...' : 'END TERM'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NominateTerm;
