"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Shield, Zap, ChevronDown, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from '@/lib/supabase';

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
            const supabase = getSupabaseBrowser();
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUserId(data.user.id);
        };
        getUser();
    }, []);

    const handleCheckout = async (priceId: string) => {
        try {
            const response = await fetch("/api/checkout_sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, isYearly, userId }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to create checkout session. Are your API keys configured?");
            }
        } catch (error) {
            console.error("Error redirecting to checkout", error);
        }
    };

    return (
        <div className="pricing-layout">
            {/* Header / Nav */}
            <header className="pricing-header">
                <div className="header-inner">
                    <a href="/" className="header-brand">
                        <div className="brand-dot"></div>
                        <span className="brand-text">Praxis Loci</span>
                    </a>
                    <div className="header-actions">
                        <a href="/login?tab=signin" className="action-link">Sign In</a>
                        <a href="/login?tab=signup" className="action-btn-primary">
                            Get Started
                        </a>
                    </div>
                </div>
            </header>

            <main className="pricing-main">
                {/* Hero Header */}
                <div className="hero-section">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="hero-title"
                    >
                        Experience Dining <br /><span className="hero-highlight">Reimagined</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="hero-subtitle"
                    >
                        From local secrets to real-time availability. Choose the intelligence layer that powers your culinary journey.
                    </motion.p>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="billing-toggle-wrapper"
                    >
                        <div className="billing-toggle-container">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`toggle-btn ${!isYearly ? 'active' : ''}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`toggle-btn ${isYearly ? 'active' : ''}`}
                            >
                                Yearly <span className="save-badge">Save 20%</span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Pricing Cards */}
                <div className="pricing-cards-grid">
                    {/* Card: Explorer */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="pricing-card"
                    >
                        <div className="card-header">
                            <span className="card-tier">Explorer</span>
                            <div className="card-price-container">
                                <span className="card-price">$0</span>
                                <span className="card-period">/mo</span>
                            </div>
                        </div>
                        <ul className="card-features">
                            <li><CheckCircle2 className="feature-icon" /> Standard Map Access</li>
                            <li><CheckCircle2 className="feature-icon" /> 3 AI Search Queries/Day</li>
                            <li><CheckCircle2 className="feature-icon" /> Community Reviews</li>
                        </ul>
                        <button onClick={() => window.location.href = "/login?tab=signup"} className="card-button outline">
                            Free Forever
                        </button>
                    </motion.div>

                    {/* Card: Local Insider (Popular) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="pricing-card highlighted"
                    >
                        <div className="card-glow"></div>
                        <div className="popular-badge-wrapper">
                            <span className="popular-badge">Most Popular</span>
                        </div>
                        <div className="card-header">
                            <span className="card-tier highlighted">Local Insider</span>
                            <div className="card-price-container pb-2">
                                <span className="card-price px-large">${isYearly ? "9" : "12"}</span>
                                <span className="card-period md">/mo</span>
                            </div>
                            {isYearly && <span className="card-subprice">Billed ${12 * 9} yearly</span>}
                        </div>
                        <ul className="card-features highlighted">
                            <li><CheckCircle2 className="feature-highlight-icon" /> Unlimited AI Search Queries</li>
                            <li><CheckCircle2 className="feature-highlight-icon" /> Real-time Crowd Density Data</li>
                            <li><CheckCircle2 className="feature-highlight-icon" /> 6-Signal Target Breakdown</li>
                            <li><CheckCircle2 className="feature-highlight-icon" /> Advanced Dietary Filters</li>
                            <li><CheckCircle2 className="feature-highlight-icon" /> Exclusive Member Perks</li>
                        </ul>
                        <button
                            onClick={() => handleCheckout("pro-tier")}
                            className="card-button primary"
                        >
                            Start 14-Day Free Trial <ArrowRight size={18} className="btn-icon" />
                        </button>
                    </motion.div>

                    {/* Card: Urban Analyst */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="pricing-card"
                    >
                        <div className="card-header">
                            <span className="card-tier">Urban Analyst</span>
                            <div className="card-price-container pb-2">
                                <span className="card-price px-large">${isYearly ? "23" : "29"}</span>
                                <span className="card-period md">/mo</span>
                            </div>
                            {isYearly && <span className="card-subprice">Billed ${29 * 9} yearly</span>}
                        </div>
                        <ul className="card-features">
                            <li><CheckCircle2 className="feature-icon" /> Market Intelligence Dashboard</li>
                            <li><CheckCircle2 className="feature-icon" /> Historical Trend Analytics</li>
                            <li><CheckCircle2 className="feature-icon" /> Bulk Data Export (CSV/JSON)</li>
                            <li><CheckCircle2 className="feature-icon" /> Developer API Access</li>
                        </ul>
                        <button
                            onClick={() => handleCheckout("premium-tier")}
                            className="card-button solid-white"
                        >
                            Upgrade to Premium
                        </button>
                    </motion.div>
                </div>

                {/* Secure Badge */}
                <div className="secure-badge">
                    <Shield size={16} /> Secure payments powered by Stripe
                </div>

                {/* Comparison Table */}
                <div className="comparison-section">
                    <h2 className="section-title text-center">Compare All Features</h2>
                    <div className="table-wrapper">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th className="feature-col">Feature</th>
                                    <th>Explorer</th>
                                    <th className="highlight-col">Insider</th>
                                    <th>Analyst</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ComparisonRow label="AI Search Queries" f1="3 per day" f2="Unlimited" f3="Unlimited" highlight={false} />
                                <ComparisonRow label="Live Crowd Monitoring" f1="No" f2="Yes" f3="Yes" highlight={true} />
                                <ComparisonRow label="6-Signal Target Breakdown" f1="No" f2="Yes" f3="Yes" highlight={true} />
                                <ComparisonRow label="Custom Lists & Pins" f1="Up to 5" f2="Unlimited" f3="Unlimited" highlight={false} />
                                <ComparisonRow label="Neighborhood Comparisons" f1="No" f2="Yes" f3="Yes" highlight={false} />
                                <ComparisonRow label="PDF Report Generation" f1="No" f2="Yes" f3="Yes" highlight={false} />
                                <ComparisonRow label="City-wide CSV Export" f1="No" f2="No" f3="Yes" highlight={false} />
                                <ComparisonRow label="Developer API Access" f1="No" f2="No" f3="Yes" highlight={true} />
                                <ComparisonRow label="Support Level" f1="Community" f2="Priority Email" f3="24/7 Dedicated" highlight={false} />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ Accordion */}
                <div className="faq-section">
                    <h2 className="section-title text-center">Frequently Asked Questions</h2>
                    <div className="faq-list">
                        <FaqItem idx={0} openFaq={openFaq} setOpenFaq={setOpenFaq} q="How accurate is the Tourist Targeting Score?" a="Our score is built on multiple overlapping geospatial, economic, and linguistic data points. While no algorithm is perfect, our 6-signal baseline accurately identifies venues prioritizing high-turnover tourist crowds over quality in over 89% of backtested scenarios." />
                        <FaqItem idx={1} openFaq={openFaq} setOpenFaq={setOpenFaq} q="Can I switch plans later?" a="Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new features will be available immediately." />
                        <FaqItem idx={2} openFaq={openFaq} setOpenFaq={setOpenFaq} q="What format are the CSV exports in the Analyst tier?" a="The dataset exports include latitude/longitude, our 6-signal breakdown scores, raw NLP semantic values, average price points, and proximity bounds to local attractions. They are formatted as standard UTF-8 CSVs." />
                        <FaqItem idx={3} openFaq={openFaq} setOpenFaq={setOpenFaq} q="How does the 14-day trial work?" a="Your card will not be charged until the end of your 14-day trial. You will have full access to all Insider features during this time." />
                    </div>
                </div>

                {/* CTA Footer Section */}
                <div className="cta-footer">
                    <div className="cta-glow"></div>
                    <div className="cta-content">
                        <h2>Still have questions?</h2>
                        <p>Our dining intelligence experts are here to help you find the right fit for your needs.</p>
                        <div className="cta-actions">
                            <button className="cta-button primary-solid">
                                Talk to an Expert
                            </button>
                            <a href="/" className="cta-button outline-glass">
                                Explore the Map
                            </a>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

function ComparisonRow({ label, f1, f2, f3, highlight }: { label: string, f1: string, f2: string, f3: string, highlight: boolean }) {
    const renderCell = (val: string, hl: boolean) => {
        if (val === "Yes") return <Check size={20} className={hl ? "icon-highlight" : "icon-standard"} />;
        if (val === "No") return <span className="dash">—</span>;
        return <span className={hl ? "text-highlight" : "text-standard"}>{val}</span>;
    }
    return (
        <tr className="comp-row">
            <td className="feature-name">{label}</td>
            <td>{renderCell(f1, false)}</td>
            <td>{renderCell(f2, true)}</td>
            <td>{renderCell(f3, false)}</td>
        </tr>
    )
}

function FaqItem({ idx, openFaq, setOpenFaq, q, a }: { idx: number, openFaq: number | null, setOpenFaq: (i: number | null) => void, q: string, a: string }) {
    const isOpen = openFaq === idx;
    return (
        <div className="faq-item">
            <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="faq-trigger"
            >
                <span className="faq-question">{q}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={20} className="faq-icon" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="faq-answer-container"
                        style={{ overflow: 'hidden' }}
                    >
                        <p className="faq-answer">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
