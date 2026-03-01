import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Lazy load instances so Next.js static compilation doesn't fail on missing keys
function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
    });
}

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xxxx.supabase.co",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.xxxxxx"
    );
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // In your checkout route, you must pass the Supabase user UUID as client_reference_id
        const userUuid = session.client_reference_id;
        if (!userUuid) {
            console.error("No user UUID provided via client_reference_id on Stripe Session");
            return NextResponse.json({ received: true });
        }

        // Determine tier based on the Price ID purchased
        // (You should use session.line_items, but simplified for webhook example)
        let newTier = "pro"; // Default assumption

        // Update the Supabase User record securely via Service Role
        const { error } = await getSupabase()
            .from("users")
            .update({
                subscription_tier: newTier,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userUuid);

        if (error) {
            console.error("Supabase update failed:", error);
            // Handle error (perhaps retry later)
        }
    }

    // Handle subscription cancellations
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await getSupabase()
            .from("users")
            .update({ subscription_tier: "free" })
            .eq("stripe_subscription_id", subscription.id);
    }

    return NextResponse.json({ received: true });
}
