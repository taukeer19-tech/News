import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { Contacts } from './pages/Contacts';
import { Settings } from './pages/Settings';
import { Templates } from './pages/Templates';

// --- Auth Guard Placeholder ---
// In a real app, this would check the Firebase auth state
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = true; // For now, we allow access
  return isAuthenticated ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

// --- Redirect Root to Dashboard ---
const HomeRedirect = () => <Navigate to="/dashboard" replace />;

// --- Login Page Placeholder ---
const Login = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950 font-inter">
    <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 italic uppercase">
          News Portal
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Marketing & Newsletter Platform</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 uppercase italic tracking-widest">Email Address</label>
          <input type="email" placeholder="admin@news.portal" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 uppercase italic tracking-widest">Password</label>
          <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
        </div>
        <button onClick={() => window.location.href = '/dashboard'} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
          Sign In
        </button>
      </div>
      <p className="mt-8 text-center text-xs text-slate-500 italic">
        Powered by Vite + Firebase • Modern Glassmorphism Stack
      </p>
    </div>
  </div>
);

export default App;
