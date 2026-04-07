import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/IMlogo.jpg';
// Icons removed as requested
import { LogOut } from 'lucide-react'; // Keeping LogOut for footer as it might be an exception? Or remove all? User said "sidebar along with text". I will remove it from the menu items first. I'll keep LogOut in footer for now or remove it? "remove all the icons used in sidebar". I'll remove LogOut too to be safe.

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleNavigation = (e, path, sectionId) => {
    e.preventDefault();

    const currentPath = location.pathname;
    const targetBasePath = path.split('#')[0];

    if (currentPath !== targetBasePath) {
      navigate(path);
      return;
    }

    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const menus = [
    // COMMON: Dynamic Home Link
    {
      name: 'Home',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard' :
        (user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff') ? '/academic-staff/dashboard' :
          (user.role_name === 'Junior_Treasurer' || user.role_name === 'Junior Treasurer') ? '/exec/junior-treasurer-dashboard' :
            (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard' :
              (user.role_name === 'President') ? '/exec/president-dashboard' :
                (user.hierarchy_level >= 4 ? '/exec/dashboard' : '/member/dashboard'),
      id: null,
      show: true
    },

    // OC MEMBERS SPECIFIC
    {
      name: 'My Events',
      path: '/member/oc-dashboard#my-events',
      id: 'my-events',
      show: user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee'
    },
    {
      name: 'Tasks to Approve',
      path: '/member/oc-dashboard#tasks-to-approve',
      id: 'tasks-to-approve',
      show: user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee'
    },

    {
      name: 'Finance Overview',
      path: '/exec/junior-treasurer-dashboard#financial-overview',
      id: 'financial-overview',
      show: (user.role_name === 'Junior_Treasurer' || user.role_name === 'Junior Treasurer' || user.hierarchy_level === 5) && user.role_name !== 'President'
    },

    // ACADEMIC STAFF & SENIOR TREASURER
    {
      name: 'Accounts Summary',
      path: '/academic-staff/senior-treasurer-dashboard#financial-overview',
      id: 'financial-overview',
      show: user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer'
    },
    {
      name: 'Pending Finance Approvals',
      path: '/academic-staff/senior-treasurer-dashboard#pending-approvals',
      id: 'pending-approvals',
      show: user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer'
    },
    {
      name: 'Transactions',
      path: '/academic-staff/senior-treasurer-dashboard#transactions',
      id: 'transactions',
      show: user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer'
    },
    {
      name: 'Student Search',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#student-search' : '/academic-staff/dashboard',
      id: 'student-search',
      show: user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic Staff' || user.role_name === 'Academic_Staff'
    },
    {
      name: 'Skill Inventory',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#skill-inventory' : '/academic-staff/dashboard#skill-inventory',
      id: 'skill-inventory',
      show: user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic Staff' || user.role_name === 'Academic_Staff'
    },
    {
      name: 'Recommendation Requests',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#recommendation-requests' : '/academic-staff/dashboard#recommendation-requests',
      id: 'recommendation-requests',
      show: user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic Staff' || user.role_name === 'Academic_Staff'
    },
    {
      name: 'Events',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#events' : '/academic-staff/dashboard#events',
      id: 'events',
      show: user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic Staff' || user.role_name === 'Academic_Staff'
    },
    // MEMBER (Students)
    {
      name: 'My Tasks',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#tasks' : '/member/dashboard',
      id: 'tasks',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && user.role_name !== 'Junior Treasurer' && user.role_name !== 'Junior_Treasurer'
    },
    {
      name: 'Volunteer Opportunities',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#volunteer' : '/member/dashboard#volunteer',
      id: 'volunteer',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && user.role_name !== 'Junior Treasurer' && user.role_name !== 'Junior_Treasurer'
    },
    {
      name: 'Events',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#events' : '/member/dashboard',
      id: 'events',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && user.role_name !== 'Junior Treasurer' && user.role_name !== 'Junior_Treasurer'
    },

    // EXEC (Level 4+)
    {
      name: 'Tasks to Approve',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#approve-tasks' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#approve-tasks' : '/exec/dashboard#approve-tasks',
      id: 'approve-tasks',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && user.role_name !== 'Senior Treasurer' && user.role_name !== 'Senior_Treasurer'
    },
    {
      name: 'My Tasks',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#my-tasks' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#my-tasks' : '/exec/dashboard#my-tasks',
      id: 'my-tasks',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && user.role_name !== 'Senior Treasurer' && user.role_name !== 'Senior_Treasurer'
    },
    {
      name: 'Volunteer Opportunities',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#volunteer-opportunities' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#volunteer-opportunities' : '/exec/dashboard#volunteer-opportunities',
      id: 'volunteer-opportunities',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && user.role_name !== 'Senior Treasurer' && user.role_name !== 'Senior_Treasurer'
    },
    {
      name: 'Events',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#events' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#events' : '/exec/dashboard#events',
      id: 'events',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && user.role_name !== 'Senior Treasurer' && user.role_name !== 'Senior_Treasurer'
    },
    {
      name: 'Term Management',
      path: '/exec/president-dashboard#term-management',
      id: 'term-management',
      show: user.role_name === 'President'
    },


  ];

  // Role-based sidebar color
  const isAcademicStaff = user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' ||
    user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer';
  const sidebarBg = isAcademicStaff ? 'bg-slate-100' : 'bg-teal-50/50';

  return (
    <aside className={`w-64 ${sidebarBg} border-r border-gray-200 h-screen fixed left-0 top-0 text-gray-600 flex flex-col z-50 shadow-sm font-sans`}>

      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <img src={logo} alt="IMSSA" className="w-8 h-8 object-contain" />
        <span className="text-lg font-bold text-gray-800 tracking-tight">IMSSA</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
        {menus.filter(m => m.show).map((item) => (
          <a
            key={item.name}
            href={item.path}
            onClick={(e) => handleNavigation(e, item.path, item.id)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium text-sm cursor-pointer hover:bg-gray-50 text-gray-500`}
          >
            {/* Icons Removed */}
            <span>{item.name}</span>
          </a>
        ))}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-gray-800">{user.full_name}</p>
            <p className="text-[10px] text-teal-600 truncate font-medium uppercase tracking-wider">
              {(user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer') ? "Senior Treasurer" :
                (user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic_Staff' || user.role_name === 'Academic Staff') ? "Academic Staff" :
                  (user.hierarchy_level >= 4) ? "Executive Board" : (user.role_name || user.user_type)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;