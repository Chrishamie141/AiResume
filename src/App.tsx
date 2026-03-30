import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import ResumePreview from './pages/ResumePreview';
import JobSearch from './pages/JobSearch';
import ApplicationTracker from './pages/ApplicationTracker';
import ResumeLibrary from './pages/ResumeLibrary';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        {user && <Navbar user={user} />}
        <div className="flex">
          {user && <Sidebar userData={userData} />}
          <main className={user ? 'flex-1 p-4 md:p-8 pb-24 md:pb-8' : 'w-full'}>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
              <Route path="/resume/:id" element={<ProtectedRoute><ResumePreview /></ProtectedRoute>} />
              <Route path="/resumes" element={<ProtectedRoute><ResumeLibrary /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
              <Route path="/tracker" element={<ProtectedRoute><ApplicationTracker /></ProtectedRoute>} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
