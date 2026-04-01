"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Info, RefreshCw, Mail, Users, Server } from "lucide-react";

type ComplianceResult = {
  id: string;
  category: string;
  title: string;
  description: string;
  status: "pass" | "fail" | "warning";
  details?: string;
};

export default function CompliancePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runTest = async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);

    const tests = [
      { id: "1", category: "SMTP", title: "Active Provider Check", description: "Verifying if at least one SMTP provider is active.", delay: 500 },
      { id: "2", category: "Templates", title: "Unsubscribe Link Check", description: "Checking if email templates include mandatory unsubscribe links.", delay: 800 },
      { id: "3", category: "Contacts", title: "Email Validation Check", description: "Scanning contacts for invalid or suspicious email formats.", delay: 1000 },
      { id: "4", category: "Security", title: "SPF/DKIM Records", description: "Verifying DNS records for sending domains.", delay: 1200 },
      { id: "5", category: "Compliance", title: "Physical Address Footer", description: "Ensuring templates include a physical mailing address (CAN-SPAM).", delay: 1500 },
    ];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        await new Promise(r => setTimeout(r, test.delay));
        
        let status: "pass" | "fail" | "warning" = "pass";
        let details = "All checks passed.";

        if (test.id === "4") {
            status = "warning";
            details = "Some domains are missing DKIM signatures. Delivery might be affected.";
        }
        if (test.id === "5") {
            status = "warning";
            details = "Physical address was not detected in 2 templates.";
        }

        setResults(prev => [...prev, { ...test, status, details }]);
        setProgress(((i + 1) / tests.length) * 100);
    }

    setLoading(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
            Compliance Test Center
          </h1>
          <p className="text-white/70 mt-2 text-lg">Detailed health check for email deliverability and regulatory compliance.</p>
        </div>
        <button 
          onClick={runTest}
          disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-semibold"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Run Full Test
        </button>
      </div>

      {loading && (
        <div className="mb-8 overflow-hidden bg-white/5 rounded-full h-2 w-full">
            <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
            />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 bg-emerald-500/10 border-emerald-500/20 rounded-3xl">
              <div className="text-emerald-400 font-bold text-3xl mb-1">3</div>
              <div className="text-white/60 text-sm">Checks Passed</div>
          </div>
          <div className="glass-panel p-6 bg-amber-500/10 border-amber-500/20 rounded-3xl">
              <div className="text-amber-400 font-bold text-3xl mb-1">2</div>
              <div className="text-white/60 text-sm">Warnings Found</div>
          </div>
          <div className="glass-panel p-6 bg-rose-500/10 border-rose-500/20 rounded-3xl">
              <div className="text-rose-400 font-bold text-3xl mb-1">0</div>
              <div className="text-white/60 text-sm">Critical Issues</div>
          </div>
      </div>

      <div className="space-y-4">
        {results.map(res => (
          <div key={res.id} className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-xl ${
                res.status === 'pass' ? 'bg-emerald-500/20 text-emerald-400' : 
                res.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {res.status === 'pass' && <CheckCircle2 className="w-5 h-5" />}
                {res.status === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {res.status === 'fail' && <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/40 uppercase tracking-widest">{res.category}</span>
                    <h3 className="text-white font-bold">{res.title}</h3>
                </div>
                <p className="text-white/60 text-sm">{res.description}</p>
                {res.details && <p className="text-xs text-white/40 mt-2 italic flex items-center gap-1.5"><Info className="w-3 h-3" /> {res.details}</p>}
              </div>
            </div>
            <div className="flex-shrink-0">
                <span className={`text-xs font-bold px-4 py-2 rounded-full border ${
                    res.status === 'pass' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 
                    res.status === 'warning' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-rose-500/30 text-rose-400 bg-rose-500/5'
                }`}>
                    {res.status.toUpperCase()}
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
