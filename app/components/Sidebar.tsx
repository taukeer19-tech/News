"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Send, Settings, ListFilter, FileText, LogOut, ClipboardList, UserCog, ShieldCheck, Crown, BookOpen } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { canManageTeam, canViewAuditLogs, getRoleLabel, getRoleBadgeClass, type UserRole } from "@/lib/permissions";

const coreLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Segments & Lists", href: "/lists", icon: ListFilter },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "User Guide", href: "/guide", icon: BookOpen },
];

const IS_FIREBASE_DEV =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_DB_PROVIDER === "firebase";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login" || pathname.startsWith("/unsubscribe")) return null;

  // In dev/firebase mode, if no session yet, treat user as owner for UI purposes
  // (API-level auth is the real security gate)
  const rawRole = (session?.user as any)?.role;
  const role: UserRole = rawRole
    ? (rawRole as UserRole)
    : "owner"; // Default to owner in dev to show all nav links

  const userEmail = (session?.user as any)?.email || "dev@local";

  const roleIcon = () => {
    if (role === "owner") return <Crown className="w-3 h-3" />;
    if (role === "admin") return <ShieldCheck className="w-3 h-3" />;
    return <UserCog className="w-3 h-3" />;
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white/10 backdrop-blur-2xl border-r border-white/20 p-6 flex flex-col z-40 print:hidden">
      <div className="mb-10 flex items-center justify-center px-2">
        <Link href="/" className="bg-white rounded-xl px-4 py-2 shadow-lg shadow-indigo-500/20 block border border-white/20">
          <img
            src="https://fyrptjy.stripocdn.email/content/guids/CABINET_e77334dc9b7a99972af7127fbf474f9ef41e8a3dc909c3a7e9d86f162965e37d/images/bombino_express_pvt_ltd_logo_2.PNG"
            alt="Bombino Express"
            style={{ width: '120px', height: 'auto', display: 'block' }}
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Core navigation */}
        {coreLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive ? "bg-white/20 text-white shadow-lg border border-white/10" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110 text-indigo-300" : "group-hover:scale-110"}`} />
              <span className="font-semibold tracking-wide">{item.name}</span>
            </Link>
          );
        })}

        {/* Role-gated navigation */}
        {canManageTeam(role) && (
          <>
            <div className="pt-4 pb-1 px-4 text-white/30 text-xs uppercase tracking-widest font-semibold">Workspace</div>
            <Link href="/team"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === "/team" ? "bg-white/20 text-white shadow-lg border border-white/10" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <UserCog className={`w-5 h-5 transition-transform duration-200 ${pathname === "/team" ? "scale-110 text-purple-300" : "group-hover:scale-110"}`} />
              <span className="font-semibold tracking-wide">Team</span>
            </Link>
          </>
        )}
        {canViewAuditLogs(role) && (
          <Link href="/audit-logs"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              pathname === "/audit-logs" ? "bg-white/20 text-white shadow-lg border border-white/10" : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ClipboardList className={`w-5 h-5 transition-transform duration-200 ${pathname === "/audit-logs" ? "scale-110 text-indigo-300" : "group-hover:scale-110"}`} />
            <span className="font-semibold tracking-wide">Audit Logs</span>
          </Link>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
        {/* Role badge */}
        <div className="px-2">
          <div className="text-white/40 text-xs truncate mb-1">{userEmail}</div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(role)}`}>
            {roleIcon()} {getRoleLabel(role)}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold tracking-wide">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
