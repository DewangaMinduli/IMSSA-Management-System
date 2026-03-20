import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, ChevronDown, ArrowLeft } from 'lucide-react';

const MemberRequestLetter = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [lecturers, setLecturers] = useState([]);

    // 1. FETCH ACTUAL LECTURERS
    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/users/academic-staff');
                if (response.ok) {
                    const data = await response.json();
                    setLecturers(data);
                } else {
                    console.error("Failed to fetch staff");
                }
            } catch (err) {
                console.error("Error connecting to server", err);
            }
        };
        fetchLecturers();
    }, []);

    // 2. SMART BACK LOGIC
    const handleBack = () => {
        if (user && user.hierarchy_level >= 4) {
            navigate('/exec/dashboard');
        } else {
            navigate('/member/dashboard');
        }
    };

    // 2. FORM STATE
    const [formData, setFormData] = useState({
        lecturer_user_id: '',
        letter_type: '',       // Purpose / Intention
        recipient_name: '',
        company_name: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        console.log("Sending to API:", formData);

        // SQL: INSERT INTO Letter_Request (..., letter_type, ...) VALUES (..., formData.letter_type, ...);

        setTimeout(() => {
            setLoading(false);
            alert("Request Submitted successfully!");
            handleBack(); // Go back to correct dashboard
        }, 1500);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto mb-20">
            <div className="mb-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-teal-600" /> Request Recommendation Letter
                </h2>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* A. SELECT LECTURER */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Select Lecturer</label>
                        <div className="relative">
                            <select
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                                value={formData.lecturer_user_id}
                                onChange={(e) => setFormData({ ...formData, lecturer_user_id: e.target.value })}
                                required
                            >
                                <option value="" disabled>-- Choose Staff Member --</option>
                                {lecturers.map(lec => (
                                    <option key={lec.user_id} value={lec.user_id}>{lec.full_name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* B. PURPOSE / INTENTION (Text Input) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Purpose / Intention</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.letter_type}
                            onChange={(e) => setFormData({ ...formData, letter_type: e.target.value })}
                            required
                        />
                    </div>

                    {/* C. RECIPIENT */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Addressed To</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.recipient_name}
                            onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                            required
                        />
                    </div>

                    {/* D. COMPANY */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Company / Organization</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            required
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-sm">
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default MemberRequestLetter;