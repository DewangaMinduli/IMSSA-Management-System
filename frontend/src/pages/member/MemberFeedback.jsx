import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const MemberFeedback = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const handleBack = () => {
        const role = user?.role_name;
        if (role === 'President') return navigate('/exec/president-dashboard');
        if (role === 'Junior Treasurer' || role === 'Junior_Treasurer') return navigate('/exec/junior-treasurer-dashboard');
        if (role === 'Organizing_Committee' || role === 'Organizing Committee') return navigate('/member/oc-dashboard');
        if (user?.hierarchy_level >= 4) return navigate('/exec/dashboard');
        navigate('/member/dashboard');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        fetch('http://localhost:5000/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        })
        .then(res => {
            if (res.ok) setSuccess(true);
            else alert("Failed to send feedback");
        })
        .catch(err => {
            console.error("Error sending feedback", err);
            alert("Network error sending feedback");
        })
        .finally(() => setLoading(false));
    };

    if (success) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center animate-fade-in-up mt-20">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Sent</h2>
                <p className="text-gray-500 mb-8">
                    Your message has been delivered to the Academic Staff anonymously.
                </p>
                <button
                    onClick={handleBack}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto mb-20">

            {/* HEADER */}
            <div className="mb-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-teal-600" /> Anonymous Feedback
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Type your message below. The Academic Staff will see the text, but not who sent it.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: FORM */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Message Only */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Your Message</label>
                                <textarea
                                    rows="10"
                                    placeholder="Write your concerns, suggestions, or comments here..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none leading-relaxed"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                disabled={loading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-100"
                            >
                                {loading ? 'Sending Securely...' : <><Send size={18} /> Send Feedback</>}
                            </button>

                        </form>
                    </div>
                </div>

                {/* RIGHT: INFO & DISCLAIMER */}
                <div className="space-y-6">

                    {/* Privacy Badge (Simplified) */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                            <Shield className="text-gray-400 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm">Anonymous</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Your identity is hidden. The staff will only see your message text.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Who sees this? (Simplified) */}
                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                            <AlertCircle size={16} className="text-gray-400" /> Visibility
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Only <strong>Academic Staff</strong> can view this feedback.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default MemberFeedback;
