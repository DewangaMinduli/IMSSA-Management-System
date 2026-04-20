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

  const isAcademicStaff = user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' ||
    user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer' || user.role_name === 'Academic Staff' || user.role_name === 'Academic_Staff';

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
      show: (user.role_name === 'Junior_Treasurer' || user.role_name === 'Junior Treasurer' || user.hierarchy_level === 5) && user.role_name !== 'President' && !isAcademicStaff
    },

    // ACADEMIC STAFF & SENIOR TREASURER
    {
      name: 'Financial Overview',
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
      show: isAcademicStaff
    },
    {
      name: 'Skill Inventory',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#skill-inventory' : '/academic-staff/dashboard#skill-inventory',
      id: 'skill-inventory',
      show: isAcademicStaff
    },
    {
      name: 'Recommendation Requests',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#recommendation-requests' : '/academic-staff/dashboard#recommendation-requests',
      id: 'recommendation-requests',
      show: isAcademicStaff
    },
    {
      name: 'Events',
      path: (user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer' || user.role === 'senior_treasurer') ? '/academic-staff/senior-treasurer-dashboard#events' : '/academic-staff/dashboard#events',
      id: 'events',
      show: isAcademicStaff
    },
    // MEMBER (Students)
    {
      name: 'My Tasks',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#tasks' : '/member/dashboard',
      id: 'tasks',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && !isAcademicStaff
    },
    {
      name: 'Volunteer Opportunities',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#volunteer' : '/member/dashboard#volunteer',
      id: 'volunteer',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && !isAcademicStaff
    },
    {
      name: 'Events',
      path: (user.role_name === 'Organizing_Committee' || user.role_name === 'Organizing Committee') ? '/member/oc-dashboard#events' : '/member/dashboard',
      id: 'events',
      show: user.user_type === 'Student' && user.hierarchy_level < 4 && !isAcademicStaff
    },

    // EXEC (Level 4+)
    {
      name: 'Tasks to Approve',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#approve-tasks' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#approve-tasks' : '/exec/dashboard#approve-tasks',
      id: 'approve-tasks',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && !isAcademicStaff
    },
    {
      name: 'My Tasks',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#my-tasks' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#my-tasks' : '/exec/dashboard#my-tasks',
      id: 'my-tasks',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && !isAcademicStaff
    },
    {
      name: 'Volunteer Opportunities',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#volunteer-opportunities' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#volunteer-opportunities' : '/exec/dashboard#volunteer-opportunities',
      id: 'volunteer-opportunities',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && !isAcademicStaff
    },
    {
      name: 'Events',
      path: (user.role_name === 'President') ? '/exec/president-dashboard#events' : (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? '/exec/junior-treasurer-dashboard#events' : '/exec/dashboard#events',
      id: 'events',
      show: (user.hierarchy_level >= 4 || user.user_type === 'Executive') && !isAcademicStaff
    },
    {
      name: 'Term Management',
      path: '/exec/president-dashboard#term-management',
      id: 'term-management',
      show: user.role_name === 'President'
    },


  ];

  // Role-based sidebar color
  const sidebarBg = isAcademicStaff ? 'bg-slate-50' : 'bg-white';

  return (
    <aside className={`w-64 flex-shrink-0 ${sidebarBg} border-r border-slate-100 h-full text-slate-600 flex flex-col z-50 transition-all font-sans`}>

      {/* Header */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-sm">
           <img src={logo} alt="IMSSA" className="w-6 h-6 object-contain" />
        </div>
        <div>
           <span className="text-xl font-bold text-slate-900 tracking-tight block leading-none">IMSSA</span>
           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 block">Management</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto scrollbar-hide">
        <div className="px-3 mb-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Navigation</p>
        </div>
        {menus.filter(m => m.show).map((item) => {
          const isActive = location.pathname === item.path.split('#')[0] && (!item.id || location.hash === `#${item.id}`);
          return (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => handleNavigation(e, item.path, item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                isActive 
                ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 font-bold border border-slate-200 shadow-sm">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-slate-900">{user.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate font-semibold uppercase tracking-wider">
              {(user.role_name === 'Senior_Treasurer' || user.role_name === 'Senior Treasurer') ? "Senior Treasurer" :
                (user.user_type === 'Academic_Staff' || user.user_type === 'Academic Staff' || user.role_name === 'Academic_Staff' || user.role_name === 'Academic Staff') ? "Academic Staff" :
                  (user.role_name === 'President') ? "President" :
                    (user.role_name === 'Junior Treasurer' || user.role_name === 'Junior_Treasurer') ? "Junior Treasurer" :
                      (user.hierarchy_level >= 4) ? "Executive Board" : (user.role_name || user.user_type)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;