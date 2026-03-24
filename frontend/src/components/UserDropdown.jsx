import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, BellOff, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserDropdown = ({ user, colorClass = 'bg-gray-200 text-gray-600' }) => {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('imssa-theme') === 'dark');
    const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('imssa-notifications') !== 'off');
    const ref = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Apply dark mode to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('imssa-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('imssa-theme', 'light');
        }
    }, [darkMode]);

    const toggleNotifications = () => {
        const next = !notifEnabled;
        setNotifEnabled(next);
        localStorage.setItem('imssa-notifications', next ? 'on' : 'off');
    };

    const initial = user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U';

    return (
        <div className="relative" ref={ref}>
            {/* Avatar Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer select-none`}
            >
                {initial}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-10 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.full_name || user?.name || 'User'}</p>
                        <p className="text-xs text-teal-600 font-medium truncate">{user?.role_name || user?.user_type}</p>
                    </div>

                    {/* Settings */}
                    <div className="p-2 space-y-0.5 border-t border-gray-100">
                        {/* Notifications */}
                        <button
                            onClick={toggleNotifications}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                        >
                            <span className="flex items-center gap-2">
                                {notifEnabled ? <Bell size={14} className="text-teal-500" /> : <BellOff size={14} className="text-gray-400" />}
                                Notifications
                            </span>
                            {/* Toggle pill */}
                            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${notifEnabled ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${notifEnabled ? 'left-4' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-sm font-semibold"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
