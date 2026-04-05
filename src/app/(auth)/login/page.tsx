"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="min-h-screen bg-[#080C0A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(#1C262018_1px,transparent_1px),linear-gradient(90deg,#1C262018_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {/* Teal glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#2DD4BF]/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-6 h-6 rounded-md bg-[#2DD4BF] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#080C0A]" />
          </div>
          <span className="text-[18px] font-bold text-[#F0F5F1]">
            Life<span className="text-[#2DD4BF]">Audit</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0F1510] border border-[#1C2620] rounded-xl p-8">
          <h1 className="text-[20px] font-bold text-[#F0F5F1] mb-0.5">Sign in</h1>
          <p className="text-[12px] text-[#3A4A3E] mb-7">Welcome back to your audit</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#3A4A3E] uppercase tracking-[1.5px] mb-1.5">
                Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-[13px] text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#3A4A3E] uppercase tracking-[1.5px] mb-1.5">
                Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#141C15] border border-[#1C2620] rounded-lg text-[13px] text-[#F0F5F1] placeholder-[#3A4A3E] focus:outline-none focus:border-[#2DD4BF]/40 focus:ring-1 focus:ring-[#2DD4BF]/20 transition-all"
              />
            </div>

            {error && (
              <div className="bg-[#F87171]/8 border border-[#F87171]/15 text-[#F87171] text-[12px] px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#2DD4BF] text-[#080C0A] font-bold py-2.5 rounded-lg hover:bg-[#5EEAD4] transition-all disabled:opacity-50 text-[13px] tracking-wide mt-1">
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[#1C2620] text-center text-[12px] text-[#3A4A3E]">
            No account?{" "}
            <Link href="/signup" className="text-[#2DD4BF] hover:text-[#5EEAD4] transition-colors font-medium">
              Create one free
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#3A4A3E] mt-6 tracking-[1px] uppercase">
          Live intentionally
        </p>
      </div>
    </div>
  );
}
