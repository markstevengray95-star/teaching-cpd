import { getSupabaseBrowserClient } from "@/lib/supabase";

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const client = getSupabaseBrowserClient();
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token || "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Sign in is required." }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
