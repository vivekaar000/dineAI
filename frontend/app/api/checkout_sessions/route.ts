import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy load Stripe to prevent build-time crashes on Vercel without env vars
function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { priceId, isYearly } = body;

        // Ensure keys exist
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: "Stripe missing configuration keys." },
                { status: 500 }
            );
        }

        // Map abstract tier to actual Stripe Price IDs set up in your Dashboard
        // NOTE: Replace these with your actual Stripe Price IDs once you create them
        const stripePrices = {
            "pro-tier": {
                monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
                yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly"
            },
            "premium-tier": {
                monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "price_premium_monthly",
                yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || "price_premium_yearly"
            }
        };

        const tierPrices = (stripePrices as any)[priceId];
        if (!tierPrices) {
            return NextResponse.json({ error: "Invalid price tier selected." }, { status: 400 });
        }

        const exactStripePriceId = isYearly ? tierPrices.yearly : tierPrices.monthly;

        // Create Checkout Session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            // TODO: In production, pass the actual Supabase user UUID here to sync gracefully via Webhooks
            // client_reference_id: "USER_UUID_FROM_SUPABASE",
            line_items: [
                {
                    price: exactStripePriceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
        });

        return NextResponse.json({ url: session.url });

    } catch (err: any) {
        console.error("Stripe Session Error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
