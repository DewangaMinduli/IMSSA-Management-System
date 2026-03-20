import React, { useState } from 'react';
import { ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Reset failed.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Cannot connect to server.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
                    Invalid Request: Missing Token.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-[450px] rounded-lg shadow-md p-8">

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>

                {status.message && (
                    <div className={`p-3 rounded-md mb-4 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="••••••••"
                                required
                            />
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-md transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
