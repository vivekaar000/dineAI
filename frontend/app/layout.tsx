import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Dine AI — Restaurant Intelligence",
    description: "AI-powered Tourist Targeting Score — data-driven restaurant intelligence system",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Dine AI",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#080808",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
