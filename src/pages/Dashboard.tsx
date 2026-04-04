import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Send, 
  Mail, 
  TrendingUp, 
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, formatNumber } from '../lib/utils';

const data = [
  { name: 'Mon', sent: 4000, opens: 2400 },
  { name: 'Tue', sent: 3000, opens: 1398 },
  { name: 'Wed', sent: 2000, opens: 9800 },
  { name: 'Thu', sent: 2780, opens: 3908 },
  { name: 'Fri', sent: 1890, opens: 4800 },
  { name: 'Sat', sent: 2390, opens: 3800 },
  { name: 'Sun', sent: 3490, opens: 4300 },
];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    openRate: '0%',
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Stats
        const contactsSnap = await getDocs(collection(db, 'contacts'));
        const campaignsSnap = await getDocs(collection(db, 'campaigns'));
        
        let totalSent = 0;
        let totalOpens = 0;
        
        const campaignsList: any[] = [];
        campaignsSnap.forEach(doc => {
          const data = doc.data();
          totalSent += data.sentCount || 0;
          totalOpens += data.openCount || 0;
          campaignsList.push({ id: doc.id, ...data });
        });

        const openRate = totalSent > 0 
          ? Math.round((totalOpens / totalSent) * 100) + '%' 
          : '0%';

        setStats({
          totalContacts: contactsSnap.size,
          activeCampaigns: campaignsList.filter(c => c.status === 'active').length,
          emailsSent: totalSent,
          openRate,
        });

        setRecentCampaigns(campaignsList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Contacts', value: stats.totalContacts, icon: Users, color: 'text-blue-500', trend: '+12.5%', isUp: true },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Send, color: 'text-indigo-500', trend: '+3.2%', isUp: true },
    { label: 'Emails Sent', value: stats.emailsSent, icon: Mail, color: 'text-purple-500', trend: '+18.4%', isUp: true },
    { label: 'Avg Open Rate', value: stats.openRate, icon: TrendingUp, color: 'text-emerald-500', trend: '-2.1%', isUp: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Welcome back. Here's what's happening with your platform.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium">
            Export Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all font-medium text-white shadow-lg shadow-indigo-500/20">
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="group p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-medium", stat.isUp ? "text-emerald-500" : "text-rose-500")}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1">{loading ? '...' : formatNumber(stat.value as number)}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Campaign Performance</h3>
              <p className="text-slate-400 text-sm">Emails sent vs. engagement metrics</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOpens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h3 className="text-lg font-bold mb-6">Recent Campaigns</h3>
          <div className="space-y-6">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : recentCampaigns.length === 0 ? (
              <p className="text-slate-500">No recent campaigns</p>
            ) : (
              recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Send size={18} />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate w-32">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{campaign.sentCount || 0}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Sent</p>
                  </div>
                </div>
              ))
            )}
            <button className="w-full py-3 mt-4 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-dashed border-white/10 transition-all">
              View All Campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
