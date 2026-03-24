import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Plus, Trash2, Home, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from '../../components/UserDropdown';

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [eventName, setEventName] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [venue, setVenue] = useState('');
    
    // UI Messages
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    // Organizers state includes search functionality per row
    const [organizers, setOrganizers] = useState([
        { id: Date.now(), name: '', user_id: '', studentId: '', designation: '', searchQuery: '', searchResults: [], showDropdown: false }
    ]);

    // Predefined Roles
    const PREDEFINED_ROLES = [
        "Main Coordinator",
        "Finance Coordinator",
        "Marketing Coordinator",
        "PR Coordinator",
        "Secretary",
        "Partnership Coordinator",
        "Editor-in-Chief",
        "Organizing Committee Member"
    ];

    // Handlers
    const addOrganizer = () => {
        setOrganizers([...organizers, { id: Date.now(), name: '', user_id: '', studentId: '', designation: 'Organizing Committee Member', searchQuery: '', searchResults: [], showDropdown: false }]);
    };

    const removeOrganizer = (id) => {
        if (organizers.length > 1) {
            setOrganizers(organizers.filter(org => org.id !== id));
        }
    };

    const updateOrganizer = (id, field, value) => {
        setOrganizers(prev => prev.map(org => org.id === id ? { ...org, [field]: value } : org));
    };

    // Advanced search for users per row
    const handleSearchChange = async (id, query) => {
        updateOrganizer(id, 'searchQuery', query);
        updateOrganizer(id, 'showDropdown', true);

        if (query.trim().length < 2) {
            updateOrganizer(id, 'searchResults', []);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/users/search?q=${query}`);
            const data = await res.json();
            updateOrganizer(id, 'searchResults', data);
        } catch (err) {
            console.error("Error searching users:", err);
        }
    };

    const selectUser = (id, selectedUser) => {
        setOrganizers(organizers.map(org => {
            if (org.id === id) {
                return {
                    ...org,
                    user_id: selectedUser.user_id,
                    name: selectedUser.full_name,
                    studentId: selectedUser.student_no,
                    searchQuery: `${selectedUser.full_name} (${selectedUser.student_no})`,
                    showDropdown: false
                };
            }
            return org;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Remove empty or unselected organizers
        const validOrganizers = organizers.filter(org => org.user_id && org.designation);
        
        if (validOrganizers.length === 0) {
            alert("Please assign at least one valid Organizing Committee Member.");
            return;
        }

        setLoading(true);

        const payload = {
            event_name: eventName,
            description: eventDesc,
            venue: venue,
            start_date: startDate || null,
            end_date: endDate || null,
            created_by_user_id: user.id,
            term_id: user.term_id || 1, // Fallback to term 1 if not in context
            ocMembers: validOrganizers.map(org => ({
                user_id: org.user_id,
                designation: org.designation
            }))
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccessMsg("Event Created Successfully! Redirecting...");
                setErrorMsg('');
                setTimeout(() => {
                    if (user?.role_name === 'President') {
                        navigate('/exec/president-dashboard');
                    } else {
                        navigate('/exec/dashboard');
                    }
                }, 2000);
            } else {
                const data = await res.json();
                setErrorMsg(`Error: ${data.message}`);
                setSuccessMsg('');
            }
        } catch (err) {
            console.error("Submit error:", err);
            setErrorMsg("Failed to create event due to a network error.");
            setSuccessMsg('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
            {/* HEADER */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <ArrowLeft className="cursor-pointer text-gray-500 hover:text-gray-700" size={20} onClick={() => navigate(-1)} />
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Hello, {user?.full_name?.split(' ')[0] || 'Executive'} 👋
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {user?.role_name?.replace(/_/g, ' ') || 'Executive Board'}
                    </span>
                    <UserDropdown user={user} colorClass="bg-teal-50 text-teal-700" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">Create New Event</h2>

                    {/* Status Messages */}
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-3">
                            <CheckCircle size={20} />
                            <span className="text-sm font-semibold">{successMsg}</span>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Event Details */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Event Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter event name"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={eventName}
                                    onChange={e => setEventName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Event Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Enter event description"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                    value={eventDesc}
                                    onChange={e => setEventDesc(e.target.value)}
                                ></textarea>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Venue</label>
                                <input
                                    type="text"
                                    placeholder="Event Venue / Location"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={venue}
                                    onChange={e => setVenue(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Organizing Committee */}
                        <div className="pt-6 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-6">Organizing Committee</label>

                            <div className="space-y-4">
                                {organizers.map((org) => (
                                    <div key={org.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
                                        
                                        {/* Autocomplete Student Search */}
                                        <div className="relative">
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Search Student *</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Type name or student ID..."
                                                    className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-teal-500"
                                                    value={org.searchQuery}
                                                    onChange={e => handleSearchChange(org.id, e.target.value)}
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Dropdown Results */}
                                            {org.showDropdown && org.searchResults.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                    {org.searchResults.map(userResult => (
                                                        <div 
                                                            key={userResult.user_id}
                                                            className="px-4 py-2 hover:bg-teal-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                            onClick={() => selectUser(org.id, userResult)}
                                                        >
                                                            <div className="font-bold text-sm text-gray-900">{userResult.full_name}</div>
                                                            <div className="text-xs text-gray-500">{userResult.student_no} • {userResult.role_name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Predefined Role Select */}
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-grow">
                                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Designation *</label>
                                                <select
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
                                                    value={org.designation}
                                                    onChange={e => updateOrganizer(org.id, 'designation', e.target.value)}
                                                    required
                                                >
                                                    <option value="" disabled>Select Role...</option>
                                                    {PREDEFINED_ROLES.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {organizers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOrganizer(org.id)}
                                                    className="mb-1 p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addOrganizer}
                                className="mt-4 flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                            >
                                <Plus size={16} /> Add Another Member
                            </button>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:bg-blue-400"
                            >
                                {loading ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
