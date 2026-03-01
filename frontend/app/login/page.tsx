"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, Shield } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr'

function LoginContent() {
    const searchParams = useSearchParams();
    const isSignup = searchParams.get("tab") === "signup";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setMsg("Error: Supabase is not configured yet. See docs.");
            setLoading(false);
            return;
        }

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = isSignup
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMsg(error.message);
        } else {
            setMsg(isSignup ? "Check your email for the confirmation link!" : "Logged in successfully!");
            if (!isSignup) window.location.href = "/dashboard";
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <a href="/" className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                    <span className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
                    </span>
                    DineAI
                </a>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    {isSignup ? "Create your account" : "Sign in to your account"}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    {isSignup ? "Already have an account? " : "Or "}
                    <a href={`/login?tab=${isSignup ? 'signin' : 'signup'}`} className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                        {isSignup ? "Sign in" : "start your 14-day free trial"}
                    </a>
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-6">
                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl py-8 px-8 shadow-[0_0_40px_-20px_rgba(99,102,241,0.15)] rounded-3xl">
                    <form className="space-y-6" onSubmit={handleAuth}>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Email address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="block w-full pl-10 bg-black/50 border border-white/10 rounded-xl py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-zinc-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full pl-10 bg-black/50 border border-white/10 rounded-xl py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {msg && <p className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? "Authenticating..." : (isSignup ? "Sign up" : "Sign in")}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#0a0a0a] rounded text-zinc-500">
                                    Secure Authentication
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Secure Badge */}
            <div className="mt-12 flex justify-center items-center gap-2 text-zinc-600 text-xs font-medium">
                <Shield size={14} /> Powered by Supabase Auth
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>}>
            <LoginContent />
        </Suspense>
    );
}
