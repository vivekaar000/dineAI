import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Anglap.ai — Restaurant Intelligence",
    description: "AI-powered Tourist Targeting Score — data-driven restaurant intelligence system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
