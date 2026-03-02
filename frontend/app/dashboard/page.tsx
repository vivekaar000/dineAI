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
        <div className="dashboard-layout">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <a href="/" className="dashboard-brand">
                        <div className="dashboard-brand-dot">
                            <div className="dashboard-brand-inner-dot"></div>
                        </div>
                        Anglap.ai
                    </a>
                    <button onClick={handleLogout} className="dashboard-logout">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-title-section">
                    <h1 className="dashboard-title">User Dashboard</h1>
                    <p className="dashboard-subtitle">Manage your subscription and access premium features.</p>
                </div>

                <div className="dashboard-grid">

                    {/* Sidebar / Nav */}
                    <div className="dashboard-sidebar">
                        <button className="dashboard-nav-item active">
                            <CreditCard size={18} className="dashboard-nav-icon" /> Subscription
                        </button>
                        <button className="dashboard-nav-item">
                            <User size={18} className="dashboard-nav-icon" /> Profile Settings
                        </button>
                        <button className="dashboard-nav-item">
                            <Settings size={18} className="dashboard-nav-icon" /> API Keys
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="dashboard-content">
                        {/* Profile Stub */}
                        <div className="dashboard-card">
                            <User size={100} className="dashboard-card-bg-icon" />
                            <h3 className="dashboard-card-title">Account details</h3>
                            <p className="dashboard-card-desc">
                                Logged in as: <span className="dashboard-user-email">{user?.email || "loading..."}</span>
                            </p>
                        </div>

                        {/* Billing Stub */}
                        <div className="dashboard-card">
                            <CreditCard size={100} className="dashboard-card-bg-icon" />

                            <h3 className="dashboard-card-title">Current Plan</h3>
                            <p className="dashboard-card-desc">Manage your tier and billing preferences.</p>

                            <div className="dashboard-plan-box">
                                <div className="dashboard-plan-icon-wrapper">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <div className="dashboard-plan-name-row">
                                        <span className="dashboard-plan-name">{tier === "free" ? "Explorer" : tier}</span>
                                        <span className="dashboard-plan-badge">Active</span>
                                    </div>
                                    <p className="dashboard-plan-desc">
                                        {tier === "free" ? "You are on the free tier." : "You have access to premium features."}
                                    </p>
                                </div>
                            </div>

                            <div className="dashboard-actions">
                                {tier === "free" ? (
                                    <a href="/pricing" className="dashboard-btn dashboard-btn-primary">
                                        Upgrade Plan
                                    </a>
                                ) : (
                                    <button onClick={handleManageBilling} className="dashboard-btn dashboard-btn-secondary">
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
