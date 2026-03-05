import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a singleton Supabase browser client.
 * This ensures auth state (cookies/tokens) is shared across
 * all pages and components during a session, preventing
 * the user from appearing "signed out" when navigating.
 */
export function getSupabaseBrowser() {
    if (client) return client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Supabase environment variables are not configured.');
    }

    client = createBrowserClient(url, key);
    return client;
}
