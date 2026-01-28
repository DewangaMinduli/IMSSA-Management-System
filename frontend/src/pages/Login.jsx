import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import logo from '../assets/IMlogo.jpg';

const MemberLogin = () => {
  const navigate = useNavigate();

  // 1. State to hold user input
  const { login } = useAuth();

  // 1. State
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 2. Handle Typing
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types again
    if (error) setError('');
  };

  // 3. THE REAL LOGIN LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // B. Check Response
      if (response.ok) {
        // Initialize Role Logic (Respect Backend Data if available)
        let userType = data.user.user_type || 'Student';
        let roleName = data.user.role_name || 'Member';
        let level = data.user.hierarchy_level || 1;

        if (data.user.role === 'academic_staff' || data.user.user_type === 'Academic Staff') {
          userType = 'Academic Staff';
          roleName = 'Academic Staff';
        } else if (data.user.role === 'executive') {
          userType = 'Executive';
          roleName = 'Executive Board';
          level = 4;
        }

        const sidebarUser = {
          ...data.user,
          user_type: userType,
          role_name: roleName,
          hierarchy_level: level
        };

        // Use Auth Context to Login and Save
        login(sidebarUser, data.token, rememberMe);

        console.log("Login Success:", data);

        // Redirect based on role
        // Redirect based on role
        // Redirect based on role
        // Redirect based on role
        if (data.user.name === 'Dr. Amila Withanaarachchi' || data.user.name.includes('Amila') || data.user.role === 'senior_treasurer') {
          navigate('/academic-staff/senior-treasurer-dashboard');
        } else if (data.user.student_number === 'IM/2022/006' || data.user.name === 'Sanjani Mapa' || data.user.name.includes('Sanjani')) {
          navigate('/member/oc-dashboard');
        } else if (roleName === 'Academic Staff' || userType === 'Academic Staff' || data.user.role === 'Academic Staff' || data.user.role === 'academic_staff') {
          navigate('/academic-staff/dashboard');
        } else if (data.user.role === 'executive') {
          navigate('/exec/dashboard');
        } else if (data.user.role_name === 'Junior Treasurer' || data.user.hierarchy_level === 5) {
          navigate('/exec/junior-treasurer-dashboard');
        } else {
          navigate('/member/dashboard');
        }
      } else {
        // FAILURE: Show the error from backend (e.g. "Invalid Password")
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setError('Cannot connect to server. Is the Backend running?');
    } finally {
      setIsLoading(false);
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

      {/* Card */}
      <div className="bg-mint w-full max-w-[500px] rounded-lg shadow-sm p-8">

        <h2 className="text-center text-lg font-medium text-gray-800 mb-6">Sign In</h2>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md mb-4 text-center border border-red-100 flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ID Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Student ID or Email</label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              placeholder="IM/2021/001 or Email"
              required
              autoComplete="username"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border-none rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setRememberMe(!rememberMe)}
            >
              {rememberMe ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} className="text-gray-400" />}
              <span className="text-xs text-gray-600 font-medium user-select-none">Remember Me</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-primary font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-primary hover:bg-blue-800 text-white font-medium py-3 rounded-md transition-all mt-6 text-sm flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>

        </form>

        {/* Footer Links */}
        <div className="text-center mt-6 text-xs text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-primary font-semibold hover:underline">
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;