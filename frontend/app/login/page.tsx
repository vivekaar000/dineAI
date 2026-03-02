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
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-header">
                    <a href="/" className="auth-logo">
                        <div className="auth-logo-dot"></div>
                        Anglap.ai
                    </a>
                    <h2 className="auth-title">
                        {isSignup ? "Create your account" : "Sign in to your account"}
                    </h2>
                    <p className="auth-subtitle">
                        {isSignup ? "Already have an account? " : "Or "}
                        <a href={`/login?tab=${isSignup ? 'signin' : 'signup'}`} className="auth-link">
                            {isSignup ? "Sign in" : "start your 14-day free trial"}
                        </a>
                    </p>
                </div>

                <div className="auth-card">
                    <form onSubmit={handleAuth}>
                        <div className="auth-form-group">
                            <label className="auth-label">Email address</label>
                            <div className="auth-input-wrapper">
                                <Mail className="auth-icon" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="auth-input"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
                                <Lock className="auth-icon" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="auth-input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {msg && <p className={`auth-msg ${msg.includes("Error") || msg.includes("Invalid") ? "auth-msg-error" : "auth-msg-success"}`}>{msg}</p>}

                        <div className="auth-form-group">
                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-button"
                            >
                                {loading ? "Authenticating..." : (isSignup ? "Sign up" : "Sign in")}
                            </button>
                        </div>
                    </form>

                    <div className="auth-divider-container">
                        <div className="auth-divider-line"></div>
                        <span className="auth-divider-text">Secure Authentication</span>
                    </div>
                </div>

                <div className="auth-secure-badge">
                    <Shield size={14} /> Powered by Supabase Auth
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="auth-layout"><p className="auth-subtitle">Loading...</p></div>}>
            <LoginContent />
        </Suspense>
    );
}
