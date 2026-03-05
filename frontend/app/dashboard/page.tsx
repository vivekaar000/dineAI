"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from '@/lib/supabase';
import { LogOut, CreditCard, Settings, User, Shield, Sparkles, MapPin, BarChart3, Zap, ArrowRight, ChevronRight } from "lucide-react";
import dynamic from 'next/dynamic';

const UnicornScene = dynamic(() => import('unicornstudio-react'), { ssr: false });

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [tier, setTier] = useState<string>("free");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
            const supabase = getSupabaseBrowser();
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);

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

    const handleLogout = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const tierLabel = tier === "premium" ? "Urban Analyst" : tier === "pro" ? "Insider" : "Explorer";
    const tierColor = tier === "premium" ? "#a78bfa" : tier === "pro" ? "#4fc3f7" : "#6b7280";

    return (
        <div style={{ position: 'relative', minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif", overflow: 'hidden' }}>
            {/* Unicorn Studio Animated Background */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
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

            {/* Dark overlay to ensure readability */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />

            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ═══ HEADER ═══ */}
                <header style={{
                    padding: '20px 32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    background: 'rgba(0,0,0,0.3)',
                }}>
                    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#fff' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Praxis Loci</span>
                    </a>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <a href="/" style={{
                            fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)',
                            textDecoration: 'none', transition: 'color 0.2s',
                        }}>
                            ← Back to Map
                        </a>
                        <button onClick={handleLogout} style={{
                            fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.4)',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                        }}>
                            <LogOut size={13} /> Sign out
                        </button>
                    </div>
                </header>

                {/* ═══ HERO SECTION ═══ */}
                <div style={{ padding: '60px 32px 40px', maxWidth: 960, margin: '0 auto', width: '100%', textAlign: 'center' }}>
                    {/* Tier Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 16px', borderRadius: 9999,
                        background: `${tierColor}15`, border: `1px solid ${tierColor}30`,
                        marginBottom: 24,
                    }}>
                        <Sparkles size={12} color={tierColor} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: tierColor }}>
                            {tierLabel}
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em',
                        lineHeight: 1.1, margin: '0 0 16px 0',
                        background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Command Center
                    </h1>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                        {user ? `Welcome back, ${user.email?.split('@')[0]}` : 'Loading your workspace...'}
                    </p>
                </div>

                {/* ═══ STATS ROW ═══ */}
                <div style={{ padding: '0 32px 48px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {[
                            { icon: MapPin, label: 'Restaurants Analyzed', value: '∞', desc: 'Unlimited analyses' },
                            { icon: BarChart3, label: 'AI Queries Today', value: tier === 'free' ? '3 / 5' : '∞', desc: tier === 'free' ? 'Free tier limit' : 'Unlimited' },
                            { icon: Zap, label: 'Current Plan', value: tierLabel, desc: tier === 'free' ? '$0 / month' : tier === 'pro' ? '$9 / month' : '$19 / month' },
                        ].map(({ icon: Icon, label, value, desc }, i) => (
                            <div key={i} style={{
                                padding: 24, borderRadius: 16,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(12px)',
                                transition: 'border-color 0.3s, background 0.3s',
                            }}>
                                <Icon size={16} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                                    {label}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: 4 }}>
                                    {value}
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                                    {desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ MAIN GRID ═══ */}
                <div style={{ padding: '0 32px 60px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                        {/* Card: Account */}
                        <div style={{
                            padding: 28, borderRadius: 20,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(16px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User size={16} color="#a78bfa" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Account</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Profile & credentials</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Email</div>
                                <div style={{
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                                }}>
                                    {user?.email || '...'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Member Since</div>
                                <div style={{
                                    padding: '10px 14px', borderRadius: 10,
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                }}>
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '...'}
                                </div>
                            </div>
                        </div>

                        {/* Card: Subscription */}
                        <div style={{
                            padding: 28, borderRadius: 20,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(16px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CreditCard size={16} color="#22d3ee" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Subscription</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Plan & billing</div>
                                </div>
                            </div>

                            <div style={{
                                padding: 16, borderRadius: 12,
                                background: `${tierColor}08`, border: `1px solid ${tierColor}18`,
                                marginBottom: 16,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: tierColor }}>{tierLabel}</span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                                        padding: '3px 8px', borderRadius: 6,
                                        background: 'rgba(52,211,153,0.12)', color: '#34d399',
                                        border: '1px solid rgba(52,211,153,0.2)',
                                    }}>Active</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                                    {tier === 'free'
                                        ? 'Basic access with 5 daily analyses. Upgrade to unlock the full potential.'
                                        : tier === 'pro'
                                            ? 'Unlocked all signals, radar charts, and unlimited analyses.'
                                            : 'Full access including API, CSV exports, and priority support.'}
                                </div>
                            </div>

                            {tier === 'free' ? (
                                <a href="/pricing" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '12px 20px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                                    color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}>
                                    Upgrade Plan <ArrowRight size={14} />
                                </a>
                            ) : (
                                <button style={{
                                    width: '100%', padding: '12px 20px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }} onClick={() => alert('Redirecting to Stripe Customer Portal...')}>
                                    Manage Billing
                                </button>
                            )}
                        </div>

                        {/* Card: API Access */}
                        <div style={{
                            padding: 28, borderRadius: 20,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(16px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Settings size={16} color="#facc15" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Developer API</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Keys & integration</div>
                                </div>
                            </div>

                            {tier === 'premium' ? (
                                <>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>API Key</div>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 10,
                                            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                            fontSize: 12, color: 'rgba(255,255,255,0.4)',
                                            fontFamily: "'SF Mono', 'Fira Code', monospace",
                                        }}>
                                            prx_live_••••••••••••••••
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                                        Use this key to access the Praxis Loci REST API for real-time restaurant intelligence data.
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Shield size={28} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        API Access Locked
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
                                        Available on Urban Analyst plan
                                    </div>
                                    <a href="/pricing" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        fontSize: 12, fontWeight: 600, color: '#a78bfa', textDecoration: 'none',
                                    }}>
                                        Upgrade <ChevronRight size={12} />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Card: Quick Actions */}
                        <div style={{
                            padding: 28, borderRadius: 20,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(16px)',
                            gridColumn: 'span 1',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Zap size={16} color="#34d399" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>Quick Actions</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Jump back in</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { href: '/', label: 'Open Restaurant Map', icon: MapPin, color: '#4fc3f7' },
                                    { href: '/pricing', label: 'View Pricing Plans', icon: CreditCard, color: '#a78bfa' },
                                    { href: '/about', label: 'About Praxis Loci', icon: Sparkles, color: '#34d399' },
                                ].map(({ href, label, icon: Icon, color }) => (
                                    <a key={href} href={href} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 500,
                                        transition: 'background 0.2s, border-color 0.2s',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Icon size={14} color={color} />
                                            {label}
                                        </span>
                                        <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
                                    </a>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ═══ FOOTER ═══ */}
                <div style={{
                    marginTop: 'auto', padding: '20px 32px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)',
                }}>
                    © 2026 Praxis Loci · Built with Intelligence
                </div>
            </div>
        </div>
    );
}
