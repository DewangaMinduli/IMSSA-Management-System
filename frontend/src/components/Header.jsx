import React, { useState, useEffect } from 'react';
import { Bell, Home, X, Loader } from 'lucide-react';
import UserDropdown from './UserDropdown';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    useEffect(() => {
        if (!user?.id) return;
        
        const fetchNotifications = async () => {
            try {
                console.log('[Header] Fetching notifications for user:', user.id);
                const res = await fetch(`http://localhost:5000/api/events/notifications?user_id=${user.id}&limit=20`);
                console.log('[Header] Notifications response:', res.status);
                if (res.ok) {
                    const data = await res.json();
                    console.log('[Header] Notifications data:', data);
                    setNotifications(data || []);
                }
                
                const countRes = await fetch(`http://localhost:5000/api/events/notifications/unread-count?user_id=${user.id}`);
                console.log('[Header] Unread count response:', countRes.status);
                if (countRes.ok) {
                    const countData = await countRes.json();
                    console.log('[Header] Unread count:', countData);
                    setUnreadCount(countData.unread_count || 0);
                }
            } catch (err) {
                console.error('[Header] Error fetching notifications:', err);
            }
        };

        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    // Debug state changes
    useEffect(() => {
        console.log('[Header] showNotifications changed:', showNotifications);
    }, [showNotifications]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            const notificationContainer = document.getElementById('notification-container');
            if (notificationContainer && !notificationContainer.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`http://localhost:5000/api/events/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => 
                n.notification_id === notificationId ? { ...n, is_read: 1 } : n
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.notification_id);
        }
        // Note: Navigation removed since notification table doesn't have link field
        // In future, could parse task info from message or add task_id field
        setShowNotifications(false);
    };

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
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-8 py-3 flex justify-between items-center bg-white">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4 relative">
                <div className="relative" id="notification-container">
                    <Bell
                        size={20}
                        className="text-gray-500 hover:text-teal-600 cursor-pointer transition-colors"
                        onClick={() => {
                            console.log('[Header] Bell clicked, current state:', showNotifications);
                            setShowNotifications(!showNotifications);
                        }}
                    />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-white text-[10px] text-white flex items-center justify-center font-bold pointer-events-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    {showNotifications && (
                        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-[9999]">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                                <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                                <X size={14} className="cursor-pointer text-gray-400" onClick={() => setShowNotifications(false)} />
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-4 flex justify-center">
                                        <Loader size={20} className="animate-spin text-gray-400" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">No notifications</div>
                                ) : (
                                    notifications.map(notification => (
                                        <div 
                                            key={notification.notification_id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${!notification.is_read ? 'bg-blue-50' : ''}`}
                                        >
                                            <p className={`text-xs ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="p-2 border-t border-gray-100 text-center">
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await fetch(`http://localhost:5000/api/events/notifications/read-all`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ user_id: user.id })
                                                });
                                                setUnreadCount(0);
                                                setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
                                            } catch (err) {
                                                console.error('Error marking all as read:', err);
                                            }
                                        }}
                                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
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
