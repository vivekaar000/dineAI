"use client";

/**
 * LiquidGlass — Previously added interactive 3D tilt + light tracking.
 * Interactivity has been removed per user request. Now acts as a simple wrapper.
 */

interface LiquidGlassProps {
    children: React.ReactNode;
    tiltMax?: number;
    glareOpacity?: number;
    scaleFactor?: number;
    className?: string;
    style?: React.CSSProperties;
    as?: keyof JSX.IntrinsicElements;
    disabled?: boolean;
}

export default function LiquidGlass({
    children,
    className = "",
    style = {},
}: LiquidGlassProps) {
    if (!className && Object.keys(style).length === 0) {
        return <>{children}</>;
    }

    return (
        <div className={className} style={style}>
            {children}
        </div>
    );
}
