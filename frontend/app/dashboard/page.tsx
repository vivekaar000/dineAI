"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { LogOut, CreditCard, Settings, User, Shield } from "lucide-react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>("free");

    // Check if we just came back from a successful checkout payment
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("success")) {
                alert("Payment successful! Your account is upgrading.");
            }
        }
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);

                // Fetch subscription tier from custom users table
                const { data: profile } = await supabase
                    .from("users")
                    .select("subscription_tier")
                    .eq("id", data.user.id)
                    .single();

                if (profile?.subscription_tier) {
                    setTier(profile.subscription_tier);
                }
            }
        };
        fetchUser();
    }, []);

    const handleManageBilling = async () => {
        // In a real app, this would call an API route that generates a Stripe Customer Portal link
        alert("This will redirect to the Stripe Customer Portal to upgrade, downgrade, or cancel.");
    };

    const handleLogout = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <a href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        </span>
                        DineAI
                    </a>
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">User Dashboard</h1>
                    <p className="mt-2 text-zinc-400">Manage your subscription and access premium features.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Sidebar / Nav */}
                    <div className="col-span-1 space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white font-medium transition-colors">
                            <CreditCard size={18} className="text-indigo-400" /> Subscription
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] rounded-xl text-zinc-400 font-medium transition-colors">
                            <User size={18} /> Profile Settings
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] rounded-xl text-zinc-400 font-medium transition-colors">
                            <Settings size={18} /> API Keys
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Stub */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-medium text-white mb-1">Account details</h3>
                            <p className="text-zinc-400 text-sm mb-4">Logged in as: <span className="text-white font-medium">{user?.email || "mockuser@example.com"}</span></p>
                        </div>

                        {/* Billing Stub */}
                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                <CreditCard size={100} />
                            </div>

                            <h3 className="text-lg font-medium text-white mb-1">Current Plan</h3>
                            <p className="text-zinc-400 text-sm mb-6">Manage your tier and billing preferences.</p>

                            <div className="flex items-center gap-4 mb-8 p-4 bg-black/30 rounded-xl border border-white/5">
                                <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                    <Shield size={24} className="text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-white text-lg capitalize">{tier === "free" ? "Explorer" : tier}</p>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-zinc-300">Active</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        {tier === "free" ? "You are on the free tier." : "You have access to premium features."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {tier === "free" ? (
                                    <a
                                        href="/pricing"
                                        className="flex-1 py-3 px-4 rounded-xl border border-transparent text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none transition-colors text-center shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]"
                                    >
                                        Upgrade Plan
                                    </a>
                                ) : (
                                    <button
                                        onClick={handleManageBilling}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors"
                                    >
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
