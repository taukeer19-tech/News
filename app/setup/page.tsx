"use client";

import { useState } from "react";
import { Database, Server, User, Key, ArrowRight, Loader2, Flame, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const [provider, setProvider] = useState("mysql");

  // SQL fields
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [database, setDatabase] = useState("");
  const [user, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Firebase fields
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [firebaseApiKey, setFirebaseApiKey] = useState("");
  const [firebaseServiceAccount, setFirebaseServiceAccount] = useState("");

  const isFirebase = provider === "firebase";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const body = isFirebase
        ? {
            provider,
            firebaseProjectId,
            firebaseApiKey,
            firebaseServiceAccount,
          }
        : { provider, host, port, database, user, password };

      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setTimeout(() => {
          router.push("/login?setup=success");
        }, 1500);
      } else {
        setError(data.error || "Failed to setup database. Check credentials.");
        if (data.details) setErrorDetails(data.details);
      }
    } catch (err) {
      setError("An unexpected error occurred connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-blue-600/20 blur-[120px] animate-blob animation-delay-2000"></div>
        {isFirebase && (
          <div className="absolute bottom-[-10%] left-[30%] w-[35%] h-[35%] rounded-full bg-orange-600/20 blur-[120px] animate-blob animation-delay-4000"></div>
        )}
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 max-w-xl w-full shadow-2xl shadow-indigo-500/10">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 bg-gradient-to-br ${isFirebase ? "from-orange-500 to-yellow-400" : "from-indigo-500 to-cyan-500"} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300`}>
            {isFirebase ? <Flame className="w-7 h-7 text-white" /> : <Database className="w-7 h-7 text-white" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Database Setup</h1>
            <p className="text-white/60 mt-1">Configure your primary database connection.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 text-sm flex flex-col gap-2">
            <span className="font-bold">Error Connecting</span>
            <span className="opacity-80">{error}</span>
            {errorDetails && (
              <pre className="text-xs bg-black/30 rounded-lg p-3 mt-2 text-red-300/80 whitespace-pre-wrap overflow-auto max-h-40">{errorDetails}</pre>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Database Provider</label>
            <div className="grid grid-cols-3 gap-3">
              {/* MySQL */}
              <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 transition-all ${provider === "mysql" ? "bg-indigo-500/30 border-indigo-400 ring-2 ring-indigo-500/50" : "bg-black/30 hover:bg-white/5"}`}>
                <input type="radio" name="provider" value="mysql" checked={provider === "mysql"} onChange={(e) => setProvider(e.target.value)} className="hidden" />
                <Database className="w-5 h-5 text-white mb-1 opacity-80" />
                <span className="text-white font-semibold text-sm">MySQL</span>
              </label>

              {/* SQL Server */}
              <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 transition-all ${provider === "sqlserver" ? "bg-indigo-500/30 border-indigo-400 ring-2 ring-indigo-500/50" : "bg-black/30 hover:bg-white/5"}`}>
                <input type="radio" name="provider" value="sqlserver" checked={provider === "sqlserver"} onChange={(e) => setProvider(e.target.value)} className="hidden" />
                <Server className="w-5 h-5 text-white mb-1 opacity-80" />
                <span className="text-white font-semibold text-sm text-center leading-tight">SQL<br />Server</span>
              </label>

              {/* Firebase */}
              <label className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 transition-all ${provider === "firebase" ? "bg-orange-500/20 border-orange-400 ring-2 ring-orange-500/50" : "bg-black/30 hover:bg-white/5"}`}>
                <input type="radio" name="provider" value="firebase" checked={provider === "firebase"} onChange={(e) => setProvider(e.target.value)} className="hidden" />
                <Flame className={`w-5 h-5 mb-1 ${provider === "firebase" ? "text-orange-400" : "text-white opacity-80"}`} />
                <span className="text-white font-semibold text-sm">Firebase</span>
              </label>
            </div>
          </div>

          {/* Firebase Fields */}
          {isFirebase ? (
            <>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-sm text-orange-200/80">
                🔥 Firebase Firestore (NoSQL) — Enter your Firebase project credentials below. Find them in the <strong>Firebase Console → Project Settings</strong>.
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Project ID</label>
                <div className="relative">
                  <Flame className="absolute left-4 top-3.5 w-5 h-5 text-orange-400/60" />
                  <input
                    required
                    type="text"
                    value={firebaseProjectId}
                    onChange={(e) => setFirebaseProjectId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-white/20 transition-all"
                    placeholder="my-firebase-project-id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Web API Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 w-5 h-5 text-orange-400/60" />
                  <input
                    required
                    type="text"
                    value={firebaseApiKey}
                    onChange={(e) => setFirebaseApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-white/20 transition-all"
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Service Account JSON <span className="text-white/40 font-normal">(for server-side access)</span></label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 w-5 h-5 text-orange-400/60" />
                  <textarea
                    required
                    value={firebaseServiceAccount}
                    onChange={(e) => setFirebaseServiceAccount(e.target.value)}
                    rows={5}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-white/20 transition-all resize-none font-mono text-xs"
                    placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">From Firebase Console → Project Settings → Service Accounts → Generate new private key</p>
              </div>
            </>
          ) : (
            <>
              {/* SQL Host & Port */}
              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-white/70 text-sm font-medium mb-2">Host</label>
                  <div className="relative">
                    <Server className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
                    <input
                      required
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-white/20 transition-all"
                      placeholder={provider === "mysql" ? "localhost" : "server.database.windows.net"}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-2">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-white/20 transition-all"
                    placeholder={provider === "mysql" ? "3306" : "1433"}
                  />
                </div>
              </div>

              {/* Database Name */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Database Name</label>
                <div className="relative">
                  <Database className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
                  <input
                    required
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-white/20 transition-all"
                    placeholder="newsletter_db"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
                    <input
                      required
                      type="text"
                      value={user}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-white/20 transition-all"
                      placeholder="admin"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-white/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            disabled={loading}
            className={`w-full text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 mt-8 transition-all disabled:opacity-70 shadow-lg ${
              isFirebase
                ? "bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 shadow-orange-500/25"
                : "bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-indigo-500/25"
            }`}
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> {isFirebase ? "Connecting to Firebase..." : "Connecting & Migrating..."}</>
            ) : (
              <>{isFirebase ? "Connect Firebase" : "Initialize Database"} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
