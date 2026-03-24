import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Phone, CheckCircle } from 'lucide-react';
import logo from '../assets/IMlogo.jpg';

const Signup = () => {
    const navigate = useNavigate();

    // 1. STATE TO TRACK USER TYPE
    const [userType, setUserType] = useState('Student'); // 'Student' or 'Staff'

    const [formData, setFormData] = useState({
        fullName: '',
        studentId: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- VALIDATION REGEX ---
    // Strict IM Format: IM/20XX/XXX
    const validateIMNumber = (id) => /^IM\/20\d{2}\/\d{3}$/.test(id);
    // Sri Lankan Phone: 07XXXXXXXX or +947XXXXXXXX
    const validatePhoneNumberLogic = (phone) => /^(?:\+94|0)?7\d{8}$/.test(phone);
    // Strong Password: 8+ chars, Upper, Lower, Number, Symbol
    const validateStrongPassword = (pass) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass);

    // 2. VALIDATION LOGIC
    const validateForm = () => {
        // A. Validate Student Logic
        if (userType === 'Student') {
            if (!formData.studentId.trim()) return "Student ID is required.";
            if (!validateIMNumber(formData.studentId)) return "Invalid Student ID. Format: IM/20XX/XXX (e.g., IM/2021/085)";
        }

        // B. Validate Staff Logic
        if (userType === 'Staff') {
            // Staff MUST use official email
            if (!formData.email.endsWith('@kln.ac.lk')) {
                return "Academic Staff must use an official @kln.ac.lk email.";
            }
        }

        // C. Phone Number
        if (!formData.phone) return "Phone number is required.";
        if (!validatePhoneNumberLogic(formData.phone)) return "Invalid Phone Number. Use 07XXXXXXXX or +947XXXXXXXX.";

        // D. Password
        if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
        if (!validateStrongPassword(formData.password)) {
            return "Password too weak. Must be 8+ chars, include Uppercase, Lowercase, Number, and Symbol (@$!%*?&).";
        }

        return null; // No errors
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        // PREPARE DATA FOR DATABASE
        const submissionData = {
            full_name: formData.fullName,
            email: formData.email,
            phone_number: formData.phone,
            password: formData.password,
            user_type: userType === 'Student' ? 'Student' : 'Academic_Staff',
            // Send NULL if staff, otherwise send the ID
            identifier: userType === 'Student' ? formData.studentId : formData.email
        };

        // Note: The backend expects 'identifier' which is either Student ID or Email
        // But the backend `signup` function reads `identifier` from req.body.
        // We need to match what the backend expects. 
        // Backend expects: { identifier, full_name, password, phone_number, email (opt) }

        // Let's adjust submission structure to match Backend Controller
        const payload = {
            identifier: userType === 'Student' ? formData.studentId : formData.email,
            full_name: formData.fullName,
            password: formData.password,
            phone_number: formData.phone,
            email: formData.email // Redundant for staff but safe
        };

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setLoading(false);
                setIsSuccess(true);
            } else {
                setError(data.message || 'Registration failed');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('Cannot connect to server.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">

            {/* Header */}
            <div className="text-center mb-6">
                <img src={logo} alt="IMSSA" className="w-16 h-16 object-contain mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    Industrial Management Science <br /> Students' Association
                </h1>
                <p className="text-gray-500 text-sm mt-2">University of Kelaniya</p>
            </div>

            <div className="bg-mint w-full max-w-[500px] rounded-lg shadow-sm p-8">

                {isSuccess ? (
                    <div className="text-center py-8 animate-fade-in-down">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
                        <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                            We've sent a verification link to <br/><span className="font-semibold text-gray-800">{formData.email}</span>.<br/><br/>Please confirm your email address to activate your account and log in.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-primary hover:bg-blue-800 text-white font-medium px-8 py-3 rounded-md transition-all text-sm w-full shadow-sm"
                        >
                            Return to Sign in
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 3. USER TYPE TOGGLE */}
                        <div className="flex bg-white rounded-lg p-1 mb-6 border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setUserType('Student')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${userType === 'Student' ? 'bg-teal-100 text-teal-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setUserType('Staff')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${userType === 'Staff' ? 'bg-teal-100 text-teal-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Academic Staff
                    </button>
                </div>

                <h2 className="text-center text-lg font-medium text-gray-800 mb-2">Create {userType} Account</h2>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md mb-4 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">

                    {/* Full Name (Both) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Full Name</label>
                        <input
                            type="text"
                            className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                            placeholder="e.g. Dewanga Gunawardana"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>

                    {/* 4. CONDITIONAL STUDENT ID (Students Only) */}
                    {userType === 'Student' && (
                        <div className="animate-fade-in-down">
                            <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Student ID</label>
                            <input
                                type="text"
                                className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                                placeholder="IM/2021/001"
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-500 mt-1 ml-1">Format: IM/YYYY/XXX</p>
                        </div>
                    )}

                    {/* Email Address */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                            placeholder={userType === 'Student' ? "your.email@gmail.com" : "name@kln.ac.lk"}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        {userType === 'Staff' && (
                            <p className="text-[10px] text-teal-600 mt-1 ml-1 bg-teal-50 p-1 rounded">
                                Note: Access is restricted to official <b>@kln.ac.lk</b> emails.
                            </p>
                        )}
                    </div>

                    {/* Phone Number (New) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Phone Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm pl-10"
                                placeholder="07XXXXXXXX"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>

                    {/* Passwords */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 ml-1">8+ chars, Uppercase, Lowercase, Number, Symbol.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary hover:bg-blue-800 text-white font-medium py-3 rounded-md transition-all mt-6 text-sm flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creating Account...' : <><UserPlus size={18} /> Create {userType} Account</>}
                    </button>
                </form>

                    <div className="text-center mt-6 text-xs text-gray-500">
                        Already have an account? <span onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline cursor-pointer">Sign in</span>
                    </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default Signup;