import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const notify = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            {notification && (
                <div className="fixed top-20 right-6 z-[9999] animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-md flex items-center gap-4 min-w-[300px] ${
                        notification.type === 'error' 
                            ? 'bg-red-50/90 border-red-100 text-red-800' 
                            : 'bg-teal-50/90 border-teal-100 text-teal-800'
                    }`}>
                        <div className={`w-3 h-3 rounded-full ${notification.type === 'error' ? 'bg-red-500' : 'bg-teal-500'} animate-pulse shadow-sm`}></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-0.5">
                                {notification.type === 'error' ? 'System Error' : 'Success'}
                            </span>
                            <span className="text-sm font-bold leading-tight">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotify = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotify must be used within NotificationProvider');
    return context.notify;
};
