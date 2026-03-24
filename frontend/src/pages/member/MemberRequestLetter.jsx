import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, ChevronDown, ArrowLeft, CheckCircle } from 'lucide-react';

const MemberRequestLetter = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [lecturers, setLecturers] = useState([]);

    // 1. FETCH ACTUAL ACADEMIC STAFF
    useEffect(() => {
        fetch('http://localhost:5000/api/users/academic-staff')
            .then(res => res.ok ? res.json() : [])
            .then(data => setLecturers(data))
            .catch(err => console.error('Error fetching staff', err));
    }, []);

    // 2. SMART BACK LOGIC — works for all roles
    const handleBack = () => {
        const role = user?.role_name;
        if (role === 'President') return navigate('/exec/president-dashboard');
        if (role === 'Junior Treasurer' || role === 'Junior_Treasurer') return navigate('/exec/junior-treasurer-dashboard');
        if (user?.hierarchy_level >= 4) return navigate('/exec/dashboard');
        if (role === 'Organizing_Committee' || role === 'Organizing Committee') return navigate('/member/oc-dashboard');
        navigate('/member/dashboard');
    };

    // 3. FORM STATE — purpose replaces letter_type (matches DB column)
    const [formData, setFormData] = useState({
        lecturer_user_id: '',
        purpose: '',
        recipient_name: '',
        company_name: ''
    });

    // 4. REAL SUBMIT — POSTs to backend, inserts into letter_request table
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/users/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_user_id: user.id,           // logged-in student's ID
                    lecturer_user_id: formData.lecturer_user_id,
                    purpose: formData.purpose,
                    recipient_name: formData.recipient_name,
                    company_name: formData.company_name
                })
            });
            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to submit request. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting request', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center mt-20">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                <p className="text-gray-500 mb-8">
                    Your recommendation letter request has been sent to the academic staff. You'll be notified once it's reviewed.
                </p>
                <button onClick={handleBack} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto mb-20">
            <div className="mb-8">
                <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-teal-600 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-teal-600" /> Request Recommendation Letter
                </h2>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SELECT LECTURER */}
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

                    {/* PURPOSE (maps to letter_request.purpose) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Purpose / Intention</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. Internship at ABC Company"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            required
                        />
                    </div>

                    {/* RECIPIENT */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Addressed To</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. HR Manager"
                            value={formData.recipient_name}
                            onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                            required
                        />
                    </div>

                    {/* COMPANY */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Company / Organization</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="e.g. ABC Technologies"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            required
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-sm transition-colors disabled:opacity-60">
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MemberRequestLetter;