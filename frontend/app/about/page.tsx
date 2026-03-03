"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Globe, BookOpen, Compass, MapPin, Sparkles } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="pricing-layout">
            {/* Header */}
            <header className="pricing-header">
                <div className="header-inner">
                    <a href="/" className="header-brand">
                        <div className="brand-dot"></div>
                        <span className="brand-text">Praxis Loci</span>
                    </a>
                    <div className="header-actions">
                        <a href="/" className="action-link" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ArrowLeft size={14} /> Back to Map
                        </a>
                        <a href="/pricing" className="action-btn-primary">
                            View Plans
                        </a>
                    </div>
                </div>
            </header>

            <main className="pricing-main" style={{ maxWidth: "800px" }}>
                {/* Hero */}
                <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #8b5cf6, #4fc3f7)",
                            margin: "0 auto 2rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 60px -10px rgba(139, 92, 246, 0.4)",
                        }}
                    >
                        <BookOpen size={36} color="white" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={{
                            fontSize: "clamp(2rem, 5vw, 3.5rem)",
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            marginBottom: "1rem",
                        }}
                    >
                        What is{" "}
                        <span style={{
                            background: "linear-gradient(to right, #818cf8, #c084fc, #f472b6)",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            fontStyle: "italic",
                        }}>
                            Praxis Loci
                        </span>
                        ?
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{
                            fontSize: "1.125rem",
                            color: "var(--text-secondary)",
                            maxWidth: "600px",
                            margin: "0 auto",
                            lineHeight: 1.7,
                            fontWeight: 300,
                        }}
                    >
                        The name behind the intelligence. A fusion of ancient wisdom and modern data science.
                    </motion.p>
                </div>

                {/* Latin Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        marginBottom: "3rem",
                    }}
                >
                    <div style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "1.5rem",
                        padding: "2rem",
                        textAlign: "center",
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(129, 140, 248, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 1rem",
                        }}>
                            <Sparkles size={24} color="#818cf8" />
                        </div>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.5rem", fontStyle: "italic" }}>
                            Praxis
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                            πρᾶξις (Greek) → prāxis (Latin)
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                            <strong style={{ color: "white" }}>Practice, action, doing.</strong> In philosophy, praxis is the process of putting theoretical knowledge into real-world practice. It represents the bridge between understanding and action — turning raw intelligence into decisions you can act on.
                        </p>
                    </div>

                    <div style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "1.5rem",
                        padding: "2rem",
                        textAlign: "center",
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(79, 195, 247, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 1rem",
                        }}>
                            <MapPin size={24} color="#4fc3f7" />
                        </div>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.5rem", fontStyle: "italic" }}>
                            Loci
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "#4fc3f7", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                            locus, locī (Latin, genitive plural)
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                            <strong style={{ color: "white" }}>Of places.</strong> In Latin, <em>loci</em> is the genitive plural of <em>locus</em>, meaning &ldquo;of places&rdquo; or &ldquo;belonging to places.&rdquo; It evokes the ancient Roman <em>method of loci</em> — a memory technique where knowledge is anchored to specific locations.
                        </p>
                    </div>
                </motion.div>

                {/* Combined Meaning */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    style={{
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 195, 247, 0.08))",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        borderRadius: "1.5rem",
                        padding: "2.5rem",
                        marginBottom: "3rem",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div style={{
                        position: "absolute",
                        top: "-50px",
                        right: "-50px",
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)",
                        pointerEvents: "none",
                    }} />
                    <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 800, color: "white", marginBottom: "1rem", letterSpacing: "-0.02em" }}>
                        Together: <span style={{ fontStyle: "italic", color: "#a78bfa" }}>&ldquo;The Practice of Places&rdquo;</span>
                    </h2>
                    <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
                        <strong style={{ color: "white" }}>Praxis Loci</strong> translates to <strong style={{ color: "#a78bfa" }}>&ldquo;The Practice of Places&rdquo;</strong> or more freely, <strong style={{ color: "#4fc3f7" }}>&ldquo;Wisdom Through Place.&rdquo;</strong>
                    </p>
                    <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                        It encapsulates what this platform does: transforming geospatial data about <em>places</em> — restaurants, neighborhoods, cities — into <em>actionable intelligence</em>. We don&apos;t just show you a map. We decode the hidden patterns of every location, revealing which restaurants genuinely serve their community and which are optimized to extract maximum revenue from passing visitors.
                    </p>
                </motion.div>

                {/* Story Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{ marginBottom: "3rem" }}
                >
                    <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.75rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
                        The Story Behind the Name
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {[
                            {
                                icon: Globe,
                                color: "#818cf8",
                                title: "Born from a traveler's frustration",
                                text: "Every tourist has experienced it — walking into a restaurant near a famous landmark, only to be served overpriced, mediocre food in a room full of other confused visitors. The locals, meanwhile, eat somewhere else entirely. We wanted to fix that information asymmetry.",
                            },
                            {
                                icon: Compass,
                                color: "#4fc3f7",
                                title: "Inspired by the Method of Loci",
                                text: "The ancient Greeks and Romans used the \"Method of Loci\" (also called the Memory Palace technique) to organize vast amounts of knowledge by mentally linking each piece of information to a specific physical location. Praxis Loci works the same way — we anchor complex data intelligence to the geography of the real world, making it instantly accessible and spatial.",
                            },
                            {
                                icon: BookOpen,
                                color: "#f472b6",
                                title: "Philosophy meets data science",
                                text: "In Aristotelian philosophy, praxis refers to meaningful, intentional action guided by wisdom — as opposed to mere mechanical behavior. Our AI doesn't just crunch numbers. It synthesizes six independent signals — linguistic patterns, price benchmarking, crowd density, proximity analysis, reviewer locality, and sentiment — into a single, actionable Tourist Targeting Score that empowers you to make smarter choices.",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    alignItems: "flex-start",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "1rem",
                                    padding: "1.5rem",
                                }}
                            >
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: `${item.color}15`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <item.icon size={20} color={item.color} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                                        {item.title}
                                    </h3>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Pronunciation Guide */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "1.5rem",
                        padding: "2rem",
                        marginBottom: "3rem",
                        textAlign: "center",
                    }}
                >
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        How to Pronounce It
                    </h3>
                    <p style={{
                        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                        fontWeight: 800,
                        fontStyle: "italic",
                        letterSpacing: "-0.02em",
                        marginBottom: "0.5rem",
                    }}>
                        <span style={{ color: "#818cf8" }}>PRAK</span>
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                        <span style={{ color: "#a78bfa" }}>sis</span>
                        {"  "}
                        <span style={{ color: "#4fc3f7" }}>LOH</span>
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                        <span style={{ color: "#67e8f9" }}>kee</span>
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        /ˈpræk.sɪs ˈloʊ.kiː/
                    </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{
                        textAlign: "center",
                        padding: "3rem 2rem",
                        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(79, 195, 247, 0.06))",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "1.5rem",
                    }}
                >
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.75rem" }}>
                        Ready to uncover the truth behind every restaurant?
                    </h2>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                        Join thousands of informed diners who refuse to settle for tourist traps.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <a href="/" style={{
                            padding: "0.75rem 1.5rem",
                            background: "#4f46e5",
                            color: "white",
                            borderRadius: "9999px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.3)",
                            transition: "all 0.2s",
                        }}>
                            Explore the Map
                        </a>
                        <a href="/pricing" style={{
                            padding: "0.75rem 1.5rem",
                            background: "rgba(255,255,255,0.05)",
                            color: "white",
                            borderRadius: "9999px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            textDecoration: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.2s",
                        }}>
                            View Plans
                        </a>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
