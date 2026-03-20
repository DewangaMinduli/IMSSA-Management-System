import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Clock } from 'lucide-react';

const AcademicFeedback = () => {
    const [mockFeedback, setMockFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/feedback')
            .then(res => res.json())
            .then(data => {
                setMockFeedback(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching feedback:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-8 max-w-4xl mx-auto mb-20 font-sans">
            <div className="mb-8">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="text-teal-600" /> Anonymous Feedback Inbox
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Review feedback submitted anonymously by members. User identities are hidden by the system.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {mockFeedback.map((fb) => (
                    <div key={fb.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative hover:shadow-md transition-shadow">
                        <div className="absolute top-6 right-6 flex items-center gap-2 text-xs text-gray-400 font-medium">
                            <Clock size={14} /> {fb.time}
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed pr-24 whitespace-pre-wrap">
                            "{fb.text}"
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            <span>Anonymous Submission</span>
                            <span>Received: {fb.date}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicFeedback;
