"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { LogOut, CreditCard, Settings, User, Shield } from "lucide-react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>("free");
    const [activeTab, setActiveTab] = useState<"subscription" | "profile" | "api">("subscription");

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
                        Dine AI
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <a href="/" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', textDecoration: 'none' }}>
                            Return to Map
                        </a>
                        <button onClick={handleLogout} className="dashboard-logout">
                            <LogOut size={16} /> Sign out
                        </button>
                    </div>
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
                        <button
                            onClick={() => setActiveTab("subscription")}
                            className={`dashboard-nav-item ${activeTab === "subscription" ? "active" : ""}`}
                        >
                            <CreditCard size={18} className="dashboard-nav-icon" /> Subscription
                        </button>
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`dashboard-nav-item ${activeTab === "profile" ? "active" : ""}`}
                        >
                            <User size={18} className="dashboard-nav-icon" /> Profile Settings
                        </button>
                        <button
                            onClick={() => setActiveTab("api")}
                            className={`dashboard-nav-item ${activeTab === "api" ? "active" : ""}`}
                        >
                            <Settings size={18} className="dashboard-nav-icon" /> API Keys
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="dashboard-content">
                        {activeTab === "subscription" && (
                            <>
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
                            </>
                        )}

                        {activeTab === "profile" && (
                            <div className="dashboard-card">
                                <User size={100} className="dashboard-card-bg-icon" />
                                <h3 className="dashboard-card-title">Profile Settings</h3>
                                <p className="dashboard-card-desc">Update your personal information.</p>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Email Address</label>
                                    <input
                                        type="text"
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.5)', outline: 'none' }}
                                        value={user?.email || ""}
                                        disabled
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>To change your email, please contact support.</p>
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <button className="dashboard-btn dashboard-btn-secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "api" && (
                            <div className="dashboard-card">
                                <Settings size={100} className="dashboard-card-bg-icon" />
                                <h3 className="dashboard-card-title">API Keys</h3>
                                <p className="dashboard-card-desc">Access our developer API to integrate real-time dining data.</p>

                                <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', textAlign: 'center' }}>
                                    <Shield size={32} style={{ margin: '0 auto 0.5rem auto', color: '#818cf8', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', margin: '0 0 0.25rem 0' }}>Developer API is locked</p>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>API access is automatically enabled when you upgrade to the Urban Analyst tier.</p>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex' }}>
                                    <a href="/pricing" className="dashboard-btn dashboard-btn-primary">
                                        Upgrade to Analyst
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
