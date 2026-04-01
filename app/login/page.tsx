"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      if (res.error === "PENDING_APPROVAL") {
        setError("Your account is pending admin approval. Please wait for an email confirmation.");
      } else if (res.error === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Please contact support.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        <div className="text-center mb-8">
          {/* Bombino Express Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-lg shadow-black/20">
              <img
                src="https://fyrptjy.stripocdn.email/content/guids/CABINET_e77334dc9b7a99972af7127fbf474f9ef41e8a3dc909c3a7e9d86f162965e37d/images/bombino_express_pvt_ltd_logo_2.PNG"
                alt="Bombino Express"
                style={{ width: '160px', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Email Marketing Portal</h1>
          <p className="text-white/60 mt-1 text-sm">Sign in to your Bombino Express workspace</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-400/30 p-3 rounded-xl mb-5 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="Email address"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
            <input
              type={showPass ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              required placeholder="Password"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-11 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all text-sm"
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-3 p-1 text-white/40 hover:text-white/70 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 active:bg-white/10 border border-white/30 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg backdrop-blur-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <p className="text-white/60 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-white font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
