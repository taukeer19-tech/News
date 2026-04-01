"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LayoutDashboard, Users, LogOut, CodeSquare } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Platform Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Registered Tenants", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="w-64 flex-shrink-0 min-h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col relative z-20">
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Super Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
         <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all font-medium"
         >
            <CodeSquare className="w-5 h-5" />
            Exit to Portal
         </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
