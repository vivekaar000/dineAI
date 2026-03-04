"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * LiquidGlass — Adds interactive 3D tilt + light tracking + elastic press to elements.
 * Wraps children and applies mouse-tracking transforms.
 *
 * Usage:
 *   <LiquidGlass>
 *     <button className="my-btn">Click Me</button>
 *   </LiquidGlass>
 */

interface LiquidGlassProps {
    children: React.ReactNode;
    tiltMax?: number;      // Max tilt angle in degrees (default: 12)
    glareOpacity?: number; // Peak glare opacity 0-1 (default: 0.18)
    scaleFactor?: number;  // Scale on press (default: 0.95)
    className?: string;
    style?: React.CSSProperties;
    as?: keyof JSX.IntrinsicElements;
    disabled?: boolean;
}

export default function LiquidGlass({
    children,
    tiltMax = 12,
    glareOpacity = 0.18,
    scaleFactor = 0.95,
    className = "",
    style = {},
    disabled = false,
}: LiquidGlassProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const bounds = useRef<DOMRect | null>(null);
    const raf = useRef<number>(0);
    const pressing = useRef(false);

    const updateTransform = useCallback((clientX: number, clientY: number) => {
        if (!wrapRef.current || !bounds.current || disabled) return;

        const b = bounds.current;
        const cx = clientX - b.left;
        const cy = clientY - b.top;
        const px = cx / b.width;   // 0..1
        const py = cy / b.height;  // 0..1

        // Tilt: map 0..1 → -tiltMax..+tiltMax
        const rotateY = (px - 0.5) * tiltMax * 2;
        const rotateX = -(py - 0.5) * tiltMax * 2;

        const scale = pressing.current ? scaleFactor : 1;

        wrapRef.current.style.transform =
            `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale},${scale},1)`;
    }, [tiltMax, scaleFactor, disabled]);

    const onEnter = useCallback(() => {
        if (!wrapRef.current || disabled) return;
        bounds.current = wrapRef.current.getBoundingClientRect();
        wrapRef.current.style.transition = "transform 0.1s ease-out";
    }, [disabled]);

    const onMove = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (disabled) return;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => updateTransform(e.clientX, e.clientY));
    }, [updateTransform, disabled]);

    const onLeave = useCallback(() => {
        if (!wrapRef.current || disabled) return;
        cancelAnimationFrame(raf.current);
        wrapRef.current.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
        wrapRef.current.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }, [disabled]);

    const onDown = useCallback(() => {
        pressing.current = true;
        if (wrapRef.current) {
            wrapRef.current.style.transition = "transform 0.12s ease-out";
        }
    }, []);

    const onUp = useCallback(() => {
        pressing.current = false;
        if (wrapRef.current) {
            wrapRef.current.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
        }
    }, []);

    // Touch support
    useEffect(() => {
        const el = wrapRef.current;
        if (!el || disabled) return;

        const handleTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (!bounds.current) bounds.current = el.getBoundingClientRect();
            updateTransform(t.clientX, t.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            bounds.current = el.getBoundingClientRect();
            pressing.current = true;
            const t = e.touches[0];
            updateTransform(t.clientX, t.clientY);
        };

        const handleTouchEnd = () => {
            pressing.current = false;
            onLeave();
        };

        el.addEventListener("touchstart", handleTouchStart, { passive: true });
        el.addEventListener("touchmove", handleTouchMove, { passive: true });
        el.addEventListener("touchend", handleTouchEnd);

        return () => {
            el.removeEventListener("touchstart", handleTouchStart);
            el.removeEventListener("touchmove", handleTouchMove);
            el.removeEventListener("touchend", handleTouchEnd);
        };
    }, [updateTransform, onLeave, disabled]);

    return (
        <div
            ref={wrapRef}
            className={`liquid-glass-wrap ${className}`}
            onMouseEnter={onEnter}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onMouseDown={onDown}
            onMouseUp={onUp}
            style={{
                position: "relative",
                display: "inline-block",
                willChange: "transform",
                transformStyle: "preserve-3d",
                ...style,
            }}
        >
            {children}
        </div>
    );
}
