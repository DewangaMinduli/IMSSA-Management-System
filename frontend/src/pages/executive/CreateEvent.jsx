import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Plus, Trash2, Home, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [eventName, setEventName] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [organizers, setOrganizers] = useState([{ id: 1, name: '', studentId: '', role: '' }]);

    // Handlers
    const addOrganizer = () => {
        setOrganizers([...organizers, { id: Date.now(), name: '', studentId: '', role: '' }]);
    };

    const removeOrganizer = (id) => {
        if (organizers.length > 1) {
            setOrganizers(organizers.filter(org => org.id !== id));
        }
    };

    const updateOrganizer = (id, field, value) => {
        setOrganizers(organizers.map(org =>
            org.id === id ? { ...org, [field]: value } : org
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        console.log({ eventName, eventDesc, eventDate, organizers });

        // Mock API Call
        setTimeout(() => {
            setLoading(false);
            alert("Event Created Successfully!");
            navigate('/exec/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs">IM</div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Executive Board Dashboard</h1>
                        <p className="text-[10px] text-gray-500">{user?.name || "President"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/exec/dashboard')}
                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                        title="Go to Dashboard"
                    >
                        <Home size={20} />
                    </button>
                    <button className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                        Create Event
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                        Request Recommendation Letter
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">Create New Event</h2>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Event Details */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Event Name</label>
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
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Event Date</label>
                                <input
                                    type="text"
                                    placeholder="E.g., August 15-16, 2024"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={eventDate}
                                    onChange={e => setEventDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Organizing Committee */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Organizing Committee</label>

                            <div className="space-y-4">
                                {organizers.map((org, index) => (
                                    <div key={org.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-teal-500"
                                                value={org.name}
                                                onChange={e => updateOrganizer(org.id, 'name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Student ID</label>
                                            <input
                                                type="text"
                                                placeholder="E.g., IM/2021/045"
                                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-teal-500"
                                                value={org.studentId}
                                                onChange={e => updateOrganizer(org.id, 'studentId', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-grow">
                                                <label className="block text-[10px] font-semibold text-gray-500 mb-1">Role</label>
                                                <select
                                                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-teal-500"
                                                    value={org.role}
                                                    onChange={e => updateOrganizer(org.id, 'role', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Role</option>
                                                    <option value="Male Coordinator">Male Coordinator</option>
                                                    <option value="Secretary">Secretary</option>
                                                    <option value="Treasurer">Treasurer</option>
                                                    <option value="Member">Member</option>
                                                    <option value="Female Coordinator">Female Coordinator</option>
                                                </select>
                                            </div>
                                            {organizers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOrganizer(org.id)}
                                                    className="mb-0.5 p-2 text-red-400 hover:text-red-600 transition-colors"
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
                                className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700"
                            >
                                <Plus size={16} /> Add Another Organizer
                            </button>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate('/exec/dashboard')}
                                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
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
