import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar or Navbar could go here in the future */}
            <div className="flex-1">
                {children || <Outlet />}
            </div>
        </div>
    );
};

export default Layout;
