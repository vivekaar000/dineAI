"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from '@/lib/supabase';
import { LogOut, MapPin, CreditCard, Shield, Zap, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import dynamic from 'next/dynamic';

const UnicornScene = dynamic(() => import('unicornstudio-react'), { ssr: false });

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>("free");
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState<'overview' | 'subscription' | 'api'>('overview');

    useEffect(() => { setMounted(true); }, []);

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
            const supabase = getSupabaseBrowser();
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                const { data: profile } = await supabase
                    .from("users")
                    .select("subscription_tier")
                    .eq("id", data.user.id)
                    .single();
                if (profile?.subscription_tier) setTier(profile.subscription_tier);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const tierLabel = tier === "premium" ? "ANALYST" : tier === "pro" ? "INSIDER" : "EXPLORER";
    const tierColor = tier === "premium" ? "#a78bfa" : tier === "pro" ? "#22d3ee" : "#6b7280";

    const pillStyle = (active: boolean): React.CSSProperties => ({
        padding: '8px 20px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.35)',
        backdropFilter: active ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: active ? 'blur(20px)' : 'none',
        boxShadow: active ? '0 0 30px rgba(255,255,255,0.05), inset 0 0 30px rgba(255,255,255,0.03)' : 'none',
    });

    const glassCard: React.CSSProperties = {
        padding: 28,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    };

    return (
        <div style={{
            position: 'relative', minHeight: '100vh', background: '#000', color: '#fff',
            fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden',
        }}>
            {/* ═══ UNICORN STUDIO BACKGROUND ═══ */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                {mounted && (
                    <UnicornScene
                        projectId="prse7opFw0sc9FaKwFzz"
                        width="100%"
                        height="100%"
                        scale={1}
                        dpi={1.5}
                        sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.1/dist/unicornStudio.umd.js"
                    />
                )}
            </div>

            {/* Subtle overlay for text readability */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
                pointerEvents: 'none',
            }} />

            {/* ═══ CONTENT ═══ */}
            <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ─── TOP BAR ─── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 28px',
                }}>
                    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                            boxShadow: '0 0 24px rgba(139,92,246,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Praxis Loci</span>
                    </a>

                    <button onClick={handleLogout} style={{
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 9999, padding: '7px 16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                        backdropFilter: 'blur(12px)', transition: 'all 0.2s',
                    }}>
                        <LogOut size={12} /> Sign out
                    </button>
                </div>

                {/* ─── PILL NAVIGATION (like Spline tabs) ─── */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 4,
                    padding: '8px 16px', margin: '0 auto',
                    borderRadius: 9999,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                }}>
                    <button style={pillStyle(activeSection === 'overview')} onClick={() => setActiveSection('overview')}>Overview</button>
                    <button style={pillStyle(activeSection === 'subscription')} onClick={() => setActiveSection('subscription')}>Plan</button>
                    <button style={pillStyle(activeSection === 'api')} onClick={() => setActiveSection('api')}>API</button>
                </div>

                {/* ─── HERO ─── */}
                <div style={{ textAlign: 'center', padding: '56px 28px 32px' }}>
                    {/* Tier badge glow */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 14px', borderRadius: 9999, marginBottom: 20,
                        background: `${tierColor}10`, border: `1px solid ${tierColor}25`,
                        boxShadow: `0 0 20px ${tierColor}15`,
                    }}>
                        <Sparkles size={11} color={tierColor} />
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: tierColor }}>
                            {tierLabel}
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(40px, 6vw, 64px)',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        lineHeight: 1,
                        margin: '0 0 12px 0',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(180deg, #ffffff 30%, rgba(255,255,255,0.25) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.08))',
                    }}>
                        COMMAND<br />CENTER
                    </h1>

                    <p style={{
                        fontSize: 14, color: 'rgba(255,255,255,0.3)',
                        fontStyle: 'italic', fontWeight: 300, letterSpacing: '0.02em',
                    }}>
                        {user ? `Welcome, ${user.email?.split('@')[0]}` : 'Loading...'}
                    </p>
                </div>

                {/* ─── CONTENT SECTIONS ─── */}
                <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px 60px', width: '100%' }}>

                    {/* OVERVIEW */}
                    {activeSection === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {[
                                    { label: 'Analyses', value: '∞', sub: 'Unlimited' },
                                    { label: 'AI Queries', value: tier === 'free' ? '5' : '∞', sub: tier === 'free' ? 'Daily limit' : 'No limit' },
                                    { label: 'Plan', value: tierLabel, sub: tier === 'free' ? 'Free' : 'Paid' },
                                ].map(({ label, value, sub }, i) => (
                                    <div key={i} style={{
                                        ...glassCard,
                                        padding: 20,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
                                            {label}
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>
                                            {value}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Account card */}
                            <div style={glassCard}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                                    Account
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Email</div>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 12,
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                                        }}>
                                            {user?.email || '...'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Joined</div>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 12,
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                        }}>
                                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '...'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick links */}
                            <div style={glassCard}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                                    Quick Actions
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { href: '/', label: 'Open Restaurant Map', icon: MapPin, glow: '#22d3ee' },
                                        { href: '/pricing', label: 'View Plans', icon: CreditCard, glow: '#a78bfa' },
                                        { href: '/about', label: 'About Praxis Loci', icon: Sparkles, glow: '#34d399' },
                                    ].map(({ href, label, icon: Icon, glow }) => (
                                        <a key={href} href={href} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 14px', borderRadius: 12,
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                            textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.2s',
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Icon size={14} color={glow} style={{ filter: `drop-shadow(0 0 6px ${glow}40)` }} />
                                                {label}
                                            </span>
                                            <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUBSCRIPTION */}
                    {activeSection === 'subscription' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={glassCard}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>
                                    Current Plan
                                </div>

                                <div style={{
                                    padding: 20, borderRadius: 16,
                                    background: `${tierColor}06`, border: `1px solid ${tierColor}15`,
                                    boxShadow: `0 0 40px ${tierColor}06`,
                                    marginBottom: 20,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: tierColor }}>{tierLabel}</span>
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            padding: '3px 10px', borderRadius: 8,
                                            background: 'rgba(52,211,153,0.1)', color: '#34d399',
                                            border: '1px solid rgba(52,211,153,0.15)',
                                        }}>Active</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>
                                        {tier === 'free'
                                            ? 'Basic access with daily analysis limits. Upgrade to unlock full signal breakdowns, radar charts, and unlimited AI queries.'
                                            : tier === 'pro'
                                                ? 'Full signal analysis, radar visualization, and unlimited AI-powered restaurant intelligence.'
                                                : 'Everything in Insider plus API access, CSV exports, and priority support.'}
                                    </p>
                                </div>

                                {tier === 'free' ? (
                                    <a href="/pricing" style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '14px 24px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                                        color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                        boxShadow: '0 4px 30px rgba(139,92,246,0.25), 0 0 60px rgba(6,182,212,0.1)',
                                    }}>
                                        Upgrade Plan <ArrowRight size={14} />
                                    </a>
                                ) : (
                                    <button style={{
                                        width: '100%', padding: '14px 24px', borderRadius: 14,
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'inherit',
                                        backdropFilter: 'blur(12px)',
                                    }} onClick={() => alert('Redirecting to Stripe Customer Portal...')}>
                                        Manage Billing
                                    </button>
                                )}
                            </div>

                            {/* Feature comparison */}
                            <div style={glassCard}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                                    What You Get
                                </div>
                                {[
                                    { feature: 'Restaurant Map', free: true, pro: true, premium: true },
                                    { feature: 'AI Chat Assistant', free: true, pro: true, premium: true },
                                    { feature: 'All 6 Signal Scores', free: false, pro: true, premium: true },
                                    { feature: 'Target Radar Chart', free: false, pro: true, premium: true },
                                    { feature: 'Unlimited Analyses', free: false, pro: true, premium: true },
                                    { feature: 'CSV Data Exports', free: false, pro: false, premium: true },
                                    { feature: 'Developer API', free: false, pro: false, premium: true },
                                ].map(({ feature, free, pro, premium }) => {
                                    const hasIt = tier === 'premium' ? premium : tier === 'pro' ? pro : free;
                                    return (
                                        <div key={feature} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            fontSize: 13,
                                        }}>
                                            <span style={{ color: hasIt ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>{feature}</span>
                                            <span style={{ fontSize: 12, color: hasIt ? '#34d399' : 'rgba(255,255,255,0.15)' }}>
                                                {hasIt ? '✓' : '—'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* API */}
                    {activeSection === 'api' && (
                        <div style={glassCard}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>
                                Developer API
                            </div>

                            {tier === 'premium' ? (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>API Key</div>
                                        <div style={{
                                            padding: '12px 14px', borderRadius: 12,
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: 12, color: 'rgba(255,255,255,0.4)',
                                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                                        }}>
                                            prx_live_••••••••••••••••••••
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Base URL</div>
                                        <div style={{
                                            padding: '12px 14px', borderRadius: 12,
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: 12, color: '#22d3ee',
                                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                                        }}>
                                            https://api.praxisloci.com/v1
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
                                        Access real-time restaurant intelligence data via REST API. Includes all 6 signal scores, location metadata, and AI-generated insights.
                                    </p>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <Shield size={36} color="rgba(255,255,255,0.08)" style={{ marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.03))' }} />
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                                        API Access Locked
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 24 }}>
                                        Available on the Urban Analyst plan
                                    </div>
                                    <a href="/pricing" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 24px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                                        color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                        boxShadow: '0 4px 30px rgba(139,92,246,0.25)',
                                    }}>
                                        Upgrade to Analyst <ArrowRight size={14} />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── FOOTER ─── */}
                <div style={{
                    marginTop: 'auto', padding: '24px 28px',
                    textAlign: 'center', fontSize: 10,
                    color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em',
                }}>
                    © 2026 PRAXIS LOCI · BUILT WITH INTELLIGENCE
                </div>
            </div>
        </div>
    );
}
