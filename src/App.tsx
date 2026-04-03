import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
};

// --- Mock Components for Initial Setup ---

const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-10">
    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-6">
      Email Marketing Platform
    </h1>
    <p className="text-xl text-slate-400 mb-8 max-w-2xl text-center">
      A powerful, multi-tenant platform for managing contacts, templates, and automated campaigns. 
      Now running on Vite for maximum performance.
    </p>
    <div className="flex gap-4">
      <a href="/login" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all">
        Login
      </a>
      <a href="/dashboard" className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all">
        View Dashboard
      </a>
    </div>
  </div>
);

const Dashboard = () => (
  <div className="p-10">
    <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
    <p>Welcome to your marketing command center. [Migrating Components...]</p>
  </div>
);

const Login = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-6">Sign In</h2>
      {/* Login Form Implementation will follow */}
      <p className="text-slate-400">Please sign in with your credentials.</p>
    </div>
  </div>
);

export default App;
