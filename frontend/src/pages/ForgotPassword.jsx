import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message });
            } else {
                setStatus({ type: 'error', message: data.message || 'Something went wrong.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Cannot connect to server.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-[450px] rounded-lg shadow-md p-8">
                <button onClick={() => navigate('/login')} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 mb-6 text-sm">
                    <ArrowLeft size={16} /> Back to Login
                </button>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your Student ID or Email to reset your password.</p>

                {status.message && (
                    <div className={`p-3 rounded-md mb-4 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Student ID or Email</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="IM/2021/001"
                                required
                            />
                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-md transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
