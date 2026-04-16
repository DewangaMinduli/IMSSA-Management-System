import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import MemberDashboard from './pages/member/MemberDashboard';
import OrganizingCommitteeDashboard from './pages/member/OrganizingCommitteeDashboard';
import UnifiedEventDetails from './pages/Shared/UnifiedEventDetails';
import MemberProfile from './pages/member/MemberProfile';
import MemberFeedback from './pages/member/MemberFeedback';
import MemberRequestLetter from './pages/member/MemberRequestLetter';
import ExecutiveDashboard from './pages/executive/ExecutiveDashboard';
import PresidentDashboard from './pages/executive/PresidentDashboard';
import JuniorTreasurerDashboard from './pages/executive/JuniorTreasurerDashboard';
import AcademicStaffDashboard from './pages/academic-staff/AcademicStaffDashboard';
import SeniorTreasurerDashboard from './pages/academic-staff/SeniorTreasurerDashboard';
import AcademicFeedback from './pages/academic-staff/AcademicFeedback';
import CreateEvent from './pages/executive/CreateEvent';
import NominateTerm from './pages/executive/NominateTerm';
import TaskDetails from './pages/Shared/TaskDetails';

// --- THE "FIXED FRAME" LAYOUT ---
const Layout = ({ children }) => (
  <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
    {/* 1. FIXED SIDEBAR (Left) */}
    <Sidebar />

    {/* 2. RIGHT AREA (Header + Content + Footer) */}
    <div className="flex-1 ml-64 flex flex-col h-screen">

      {/* A. CONTENT AREA (This is the ONLY part that scrolls vertically) */}
      <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
        {children}
      </main>

      {/* B. FIXED FOOTER (Stays at bottom) */}
      <footer className="h-10 bg-white border-t border-gray-200 flex items-center justify-center shrink-0 z-50">
        <p className="text-[10px] text-gray-400 font-medium">
          © 2025 Industrial Management Science Students' Association. All rights reserved.
        </p>
      </footer>
    </div>
  </div>
);

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify" element={<VerifyEmail />} />

          <Route path="/events/:eventId" element={<UnifiedEventDetails />} />
          <Route path="/tasks/:taskId" element={<TaskDetails />} />

          <Route path="/member/*" element={
            <Layout>
              <Routes>
                <Route path="oc-dashboard" element={<OrganizingCommitteeDashboard />} />
                <Route path="event/:eventId" element={<UnifiedEventDetails />} />
                <Route path="dashboard" element={<MemberDashboard />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="feedback" element={<MemberFeedback />} />
                <Route path="request-letter" element={<MemberRequestLetter />} />
                <Route path="tasks/:taskId/:assignmentId" element={<TaskDetails />} />
              </Routes>
            </Layout>
          } />

          {/* Executive Routes */}
          <Route path="/exec/*" element={
            <Layout>
              <Routes>
                <Route path="dashboard" element={<ExecutiveDashboard />} />
                <Route path="president-dashboard" element={<PresidentDashboard />} />
                <Route path="junior-treasurer-dashboard" element={<JuniorTreasurerDashboard />} />
                <Route path="create-event" element={<CreateEvent />} />
                <Route path="nominate-term" element={<NominateTerm />} />
                <Route path="event/:eventId" element={<UnifiedEventDetails />} />
                <Route path="tasks/:taskId/:assignmentId" element={<TaskDetails />} />
                <Route path="*" element={<div>Exec 404</div>} />
              </Routes>
            </Layout>
          } />

          {/* Academic Staff Routes */}
          <Route path="/academic-staff/*" element={
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AcademicStaffDashboard />} />
                <Route path="senior-treasurer-dashboard" element={<SeniorTreasurerDashboard />} />
                <Route path="feedback" element={<AcademicFeedback />} />
              </Routes>
            </Layout>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </NotificationProvider>
  );
}
