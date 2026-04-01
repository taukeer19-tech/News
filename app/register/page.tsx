"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"][strength];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Registration Received!</h2>
            <p className="text-white/70">Your account has been created and is now <strong>pending admin approval</strong>.</p>
            <p className="text-white/50 text-sm mt-4 italic">You will be able to sign in once an administrator approves your request.</p>
            <Link href="/login" className="mt-8 inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl border border-white/20 transition-all font-semibold">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-white/60 mt-1 text-sm">Join your team's workspace</p>
            </div>

            {error && (
              <div className="bg-red-500/20 text-red-200 border border-red-400/30 p-3 rounded-xl mb-5 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type="text" placeholder="Full Name (optional)" value={form.name} onChange={set("name")}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type="email" placeholder="Email address" value={form.email} onChange={set("email")} required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type={showPass ? "text" : "password"} placeholder="Password (min 8 characters)"
                  value={form.password} onChange={set("password")} required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-11 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-3 p-1 text-white/40 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password && (
                <div className="space-y-1 -mt-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${["","text-red-400","text-yellow-400","text-blue-400","text-emerald-400"][strength]}`}>
                    {strengthLabel} password
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type={showConfirm ? "text" : "password"} placeholder="Confirm password"
                  value={form.confirmPassword} onChange={set("confirmPassword")} required
                  className={`w-full bg-white/10 border rounded-xl pl-11 pr-11 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-400/50 bg-red-500/10"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-emerald-400/50 bg-emerald-500/10"
                      : "border-white/20"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-3 p-1 text-white/40 hover:text-white/70 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-white/20 hover:bg-white/30 active:bg-white/10 border border-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg backdrop-blur-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-white/60 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
