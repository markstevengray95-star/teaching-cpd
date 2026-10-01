import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.117.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pickInjectedKey(legacyName: string, dictionaryName: string) {
  const legacy = Deno.env.get(legacyName);
  if (legacy) return legacy;
  const raw = Deno.env.get(dictionaryName);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default || Object.values(parsed)[0] || "";
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json().catch(() => ({}));
    const username = String(payload.username || "").trim().toLowerCase().replace(/\s+/g, "");
    const password = String(payload.password || "");
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) || !password) {
      return json({ error: "Invalid username or password" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = pickInjectedKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
    const publicKey = pickInjectedKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
    if (!url || !serviceKey || !publicKey) return json({ error: "Authentication service unavailable" }, 500);

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: profile, error: profileError } = await admin
      .from("staff_development_profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.user_id) return json({ error: "Invalid username or password" }, 401);

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.user_id);
    if (userError) throw userError;
    const email = userResult?.user?.email;
    if (!email) return json({ error: "Invalid username or password" }, 401);

    const authClient = createClient(url, publicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: signIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
    if (signInError || !signIn.session) return json({ error: "Invalid username or password" }, 401);

    return json({
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
      expires_at: signIn.session.expires_at,
      user_id: signIn.user.id,
    });
  } catch (error) {
    console.error("username-login failed", error);
    return json({ error: "Invalid username or password" }, 401);
  }
});
