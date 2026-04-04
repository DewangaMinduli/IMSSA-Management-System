import React, { useState } from 'react';
import { Bell, Home, X } from 'lucide-react';
import UserDropdown from './UserDropdown';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    // This would ideally fetch from a real notification system
    const notifications = [];

    const getRoleBadge = () => {
        if (!user) return null;
        if (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer') {
            return <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">Senior Treasurer</div>;
        }
        if (user.role_name === 'Academic_Staff' || user.role_name === 'Academic Staff') {
            return <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">Academic Staff</div>;
        }
        if (user.role_name === 'Organizing_Committee') {
            return <div className="bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700">Organizing Committee</div>;
        }
        if (user.role_name === 'President' || user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer' || user.hierarchy_level >= 4) {
            return <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700">{user.role_name}</div>;
        }
        return <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Member</div>;
    };

    const getColorClass = () => {
        if (user?.role_name === 'Organizing_Committee') return "bg-teal-50 text-teal-700";
        if (user?.hierarchy_level >= 4) return "bg-blue-50 text-blue-700";
        return "bg-slate-100 text-slate-700";
    };

    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs">IM</div>
                <div>
                    <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                    <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                </div>
            </div>
            <div className="flex items-center gap-4 relative">
                <div className="relative">
                    <Bell
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                    />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                    )}
                    {showNotifications && (
                        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                                <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowNotifications(false)} />
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="p-4 text-center text-gray-500 text-xs">No new notifications</div>
                            </div>
                        </div>
                    )}
                </div>
                <Home
                    size={20}
                    className="text-gray-500 cursor-pointer hover:text-teal-600 transition-colors"
                    onClick={() => {
                        const mainContent = document.getElementById('main-content');
                        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
                {getRoleBadge()}
                <UserDropdown user={user} colorClass={getColorClass()} />
            </div>
        </header>
    );
};

export default Header;
