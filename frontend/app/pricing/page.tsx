"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, Shield, Zap, Info, ChevronDown } from "lucide-react";

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleCheckout = async (priceId: string) => {
        try {
            const response = await fetch("/api/checkout_sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, isYearly }),
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
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 selection:bg-indigo-500/30 font-sans pb-32">
            {/* Header / Nav (Simplified) */}
            <div className="w-full flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <a href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    </span>
                    DineAI
                </a>
                <div className="flex gap-4 items-center">
                    <a href="/login?tab=signin" className="text-sm font-medium hover:text-white transition-colors">Sign in</a>
                    <a href="/login?tab=signup" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">Get Started</a>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 mt-16 md:mt-24">

                {/* Hero section */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-2">
                        <Zap size={14} className="text-indigo-400" /> Transparent Pricing
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                        Uncover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">truth</span> layer of your city.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-zinc-400 font-light">
                        Choose a pricing tier that matches the depth of analytics you need. Upgrade any time.
                    </motion.p>
                </div>

                {/* Toggle switch */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="flex justify-center items-center gap-4 mb-16">
                    <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className="relative w-14 h-7 bg-white/10 rounded-full border border-white/5 transition-colors focus:outline-none"
                    >
                        <motion.div
                            className="absolute top-1 left-1 w-5 h-5 bg-indigo-400 rounded-full shadow-md"
                            animate={{ x: isYearly ? 28 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-zinc-500'}`}>
                        Yearly <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">-20%</span>
                    </span>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">

                    {/* Free Tier */}
                    <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col hover:bg-white/[0.04] transition-colors duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Explorer</h3>
                            <p className="text-zinc-400 text-sm h-10">For curious diners who want to verify basic tourist targeting.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-zinc-500 font-medium">/month</span>
                        </div>
                        <button className="w-full py-3 mb-8 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors">
                            Current Plan
                        </button>
                        <div className="flex flex-col gap-4 text-sm flex-1">
                            <FeatureItem included>Limited restaurant searches (5/day)</FeatureItem>
                            <FeatureItem included>Basic Tourist Targeting Score</FeatureItem>
                            <FeatureItem included>Map view access</FeatureItem>
                            <FeatureItem included>View top 10 restaurants per city</FeatureItem>
                            <div className="w-full h-px bg-white/5 my-2" />
                            <FeatureItem included={false}>Advanced scoring signals breakdown</FeatureItem>
                            <FeatureItem included={false}>Historical trends & analytics</FeatureItem>
                            <FeatureItem included={false}>Export capabilities</FeatureItem>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="relative p-8 rounded-3xl bg-[#111116] border border-indigo-500/30 backdrop-blur-xl shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)] flex flex-col transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                            Most Popular
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-indigo-300 mb-2">Local Insider</h3>
                            <p className="text-zinc-400 text-sm h-10">Deep dive into the data. Perfect for foodies and local guides.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">${isYearly ? "9" : "12"}</span>
                            <span className="text-zinc-500 font-medium">/month</span>
                            {isYearly && <span className="ml-2 text-xs text-indigo-400">Billed ${12 * 9} yearly</span>}
                        </div>
                        <button
                            onClick={() => handleCheckout("pro-tier")}
                            className="w-full py-3 mb-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
                        >
                            Upgrade to Pro <ArrowRight size={16} />
                        </button>
                        <p className="text-xs text-indigo-300/80 mb-4 font-medium uppercase tracking-wider">Everything in Explorer, plus:</p>
                        <div className="flex flex-col gap-4 text-sm flex-1">
                            <FeatureItem included>Unlimited restaurant searches</FeatureItem>
                            <FeatureItem included>Full breakdown of 6 scoring signals</FeatureItem>
                            <FeatureItem included>Repeat Local Proxy analytics</FeatureItem>
                            <FeatureItem included>Review linguistic analysis</FeatureItem>
                            <FeatureItem included>Download restaurant score as PDF</FeatureItem>
                            <FeatureItem included>Neighborhood comparison tools</FeatureItem>
                        </div>
                    </div>

                    {/* Premium Tier */}
                    <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col hover:bg-white/[0.04] transition-colors duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-white mb-2">Urban Analyst</h3>
                            <p className="text-zinc-400 text-sm h-10">Power features for researchers, journalists, and power users.</p>
                        </div>
                        <div className="mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">${isYearly ? "23" : "29"}</span>
                            <span className="text-zinc-500 font-medium">/month</span>
                            {isYearly && <span className="ml-2 text-xs text-zinc-500">Billed ${29 * 9} yearly</span>}
                        </div>
                        <button
                            onClick={() => handleCheckout("premium-tier")}
                            className="w-full py-3 mb-8 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Upgrade to Premium
                        </button>
                        <p className="text-xs text-zinc-500 mb-4 font-medium uppercase tracking-wider">Everything in Pro, plus:</p>
                        <div className="flex flex-col gap-4 text-sm flex-1">
                            <FeatureItem included>City-wide restaurant dataset access</FeatureItem>
                            <FeatureItem included>Historical trend tracking</FeatureItem>
                            <FeatureItem included>CSV data export</FeatureItem>
                            <FeatureItem included>API access to Core Score</FeatureItem>
                            <FeatureItem included>Advanced multi-variable filtering</FeatureItem>
                            <FeatureItem included>Early access to new features</FeatureItem>
                        </div>
                    </div>

                </div>

                {/* Feature Comparison Table */}
                <div className="mt-32 max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-white text-center mb-10">Compare Features</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-zinc-400">
                                    <th className="py-4 font-medium">Feature</th>
                                    <th className="py-4 font-medium text-center">Explorer</th>
                                    <th className="py-4 font-medium text-center text-indigo-300">Local Insider</th>
                                    <th className="py-4 font-medium text-center text-white">Urban Analyst</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <ComparisonRow label="Daily Searches" f1="5" f2="Unlimited" f3="Unlimited" />
                                <ComparisonRow label="Basic Overall Score" f1="Yes" f2="Yes" f3="Yes" />
                                <ComparisonRow label="Top 10 City Lists" f1="Yes" f2="Yes" f3="Yes" />
                                <ComparisonRow label="Interactive Map" f1="Yes" f2="Yes" f3="Yes" />
                                <ComparisonRow label="6-Signal Breakdown" f1="No" f2="Yes" f3="Yes" />
                                <ComparisonRow label="Linguistic Analysis" f1="No" f2="Yes" f3="Yes" />
                                <ComparisonRow label="Neighborhood Comparisons" f1="No" f2="Yes" f3="Yes" />
                                <ComparisonRow label="PDF Report Generation" f1="No" f2="Yes" f3="Yes" />
                                <ComparisonRow label="City-wide CSV Export" f1="No" f2="No" f3="Yes" />
                                <ComparisonRow label="API Access" f1="No" f2="No" f3="Yes" />
                                <ComparisonRow label="Historical Trends" f1="No" f2="No" f3="Yes" />
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-32 max-w-3xl mx-auto mb-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
                    <div className="flex flex-col gap-4">
                        <FaqItem idx={0} openFaq={openFaq} setOpenFaq={setOpenFaq} q="How accurate is the Tourist Targeting Score?" a="Our score is built on multiple overlapping geospatial, economic, and linguistic data points. While no algorithm is perfect, our 6-signal baseline accurately identifies venues prioritizing high-turnover tourist crowds over quality in over 89% of backtested scenarios." />
                        <FaqItem idx={1} openFaq={openFaq} setOpenFaq={setOpenFaq} q="Can I cancel my subscription at any time?" a="Yes! You can downgrade your tier or cancel your subscription at any time directly from the user dashboard. You will retain access to your premium features until the end of your billing cycle." />
                        <FaqItem idx={2} openFaq={openFaq} setOpenFaq={setOpenFaq} q="What format are the CSV exports in the Urban Analyst tier?" a="The dataset exports include latitude/longitude, our 6-signal breakdown scores, raw NLP semantic values, average price points, and proximity bounds to local attractions. They are formatted as standard UTF-8 CSVs ready for Pandas or Excel." />
                        <FaqItem idx={3} openFaq={openFaq} setOpenFaq={setOpenFaq} q="How is the API access billed?" a="The Urban Analyst tier includes 1,000 API requests per month. If you exceed this limit, background monitoring will gently restrict your rate limit, but you will not be automatically charged overage fees unless you request a custom enterprise limit." />
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="flex justify-center items-center gap-2 text-zinc-500 text-sm pb-10">
                    <Shield size={16} /> Secure payments powered by Stripe
                </div>

            </main>
        </div>
    );
}

function FeatureItem({ children, included }: { children: React.ReactNode, included: boolean }) {
    return (
        <div className={`flex items-start gap-3 ${included ? 'text-zinc-200' : 'text-zinc-600'}`}>
            <div className="mt-0.5 mt-1 shrink-0">
                {included ? (
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Check size={10} className="text-indigo-400 font-bold" />
                    </div>
                ) : (
                    <X size={14} />
                )}
            </div>
            <span>{children}</span>
        </div>
    )
}

function ComparisonRow({ label, f1, f2, f3 }: { label: string, f1: string, f2: string, f3: string }) {
    const renderCell = (val: string) => {
        if (val === "Yes") return <Check size={16} className="text-indigo-400 mx-auto" />;
        if (val === "No") return <X size={16} className="text-zinc-700 mx-auto" />;
        return <span className="text-zinc-300">{val}</span>;
    }
    return (
        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <td className="py-4 text-zinc-300 pl-4">{label}</td>
            <td className="py-4 text-center">{renderCell(f1)}</td>
            <td className="py-4 text-center">{renderCell(f2)}</td>
            <td className="py-4 text-center">{renderCell(f3)}</td>
        </tr>
    )
}

function FaqItem({ idx, openFaq, setOpenFaq, q, a }: { idx: number, openFaq: number | null, setOpenFaq: (i: number | null) => void, q: string, a: string }) {
    const isOpen = openFaq === idx;
    return (
        <div className="border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
            <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full flex justify-between items-center p-6 text-left"
            >
                <span className="font-medium text-white">{q}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={18} className="text-zinc-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="px-6 pb-6 text-sm text-zinc-400 h-full">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
