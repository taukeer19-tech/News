import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils'; // I'll create this helper if it doesn't exist
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Send, label: 'Campaigns', path: '/campaigns' },
  { icon: Users, label: 'Contacts', path: '/contacts' },
  { icon: FileText, label: 'Templates', path: '/templates' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="w-64 min-h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col p-4">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          News Portal
        </h1>
        <p className="text-xs text-slate-500 font-medium">Marketing Platform</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white")} />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
