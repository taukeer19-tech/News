import { prisma } from "@/lib/prisma";
import { Users, Send, FileText, Database } from "lucide-react";

export const dynamic = "force-dynamic"; // skip static rendering

export default async function AdminDashboard() {
  // Fetch global metrics
  const totalUsers = await prisma.user.count();
  const totalContacts = await prisma.contact.count();
  const totalCampaigns = await prisma.campaign.count();
  const totalEmailsSent = await prisma.campaignRecipient.count({
      where: { status: "sent" }
  });

  const cards = [
    { title: "Registered Tenants", value: totalUsers, icon: Users, color: "text-blue-400" },
    { title: "Global Contacts", value: totalContacts.toLocaleString(), icon: Database, color: "text-emerald-400" },
    { title: "Total Campaigns", value: totalCampaigns, icon: FileText, color: "text-purple-400" },
    { title: "Total Emails Delivered", value: totalEmailsSent.toLocaleString(), icon: Send, color: "text-pink-400" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Platform Overview</h1>
        <p className="text-white/60 mt-2 text-lg">Global metrics and system health across all tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-black/40 rounded-xl shadow-inner border border-white/10">
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-white/60 font-medium">{card.title}</h3>
              </div>
              <p className="text-4xl font-bold text-white relative z-10">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-bold text-white mb-2">System Status</h2>
        <p className="text-white/70">All systems operational. The platform is running smoothly.</p>
        <div className="mt-6 flex items-center gap-3">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </span>
             <span className="text-emerald-400 font-medium tracking-wider uppercase text-sm">Online</span>
        </div>
      </div>
    </div>
  );
}
