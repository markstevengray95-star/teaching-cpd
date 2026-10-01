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
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = pickInjectedKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
    const publicKey = pickInjectedKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
    const authorization = req.headers.get("Authorization") || "";
    if (!url || !serviceKey || !publicKey || !authorization.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401);
    }

    const caller = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: auth, error: authError } = await caller.auth.getUser();
    if (authError || !auth.user) return json({ error: "Authentication required" }, 401);

    const payload = await req.json().catch(() => ({}));
    const username = String(payload.username || "").trim().toLowerCase().replace(/\s+/g, "");
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
      return json({ error: "Username must be 3–32 characters using letters, numbers, dots, dashes or underscores." }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: conflict, error: conflictError } = await admin
      .from("staff_development_profiles")
      .select("user_id")
      .eq("username", username)
      .neq("user_id", auth.user.id)
      .maybeSingle();
    if (conflictError) throw conflictError;
    if (conflict) return json({ error: "That username is already in use. Choose another one." }, 409);

    const { data: existing, error: existingError } = await admin
      .from("staff_development_profiles")
      .select("display_name,department,preferred_organization_id,platform_role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const userMeta = auth.user.user_metadata || {};
    const row = {
      user_id: auth.user.id,
      username,
      display_name: existing?.display_name || userMeta.full_name || userMeta.name || "",
      department: existing?.department || userMeta.department || "",
      preferred_organization_id: existing?.preferred_organization_id || null,
      platform_role: existing?.platform_role || "user",
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await admin
      .from("staff_development_profiles")
      .upsert(row, { onConflict: "user_id" });
    if (saveError) {
      if (saveError.code === "23505") return json({ error: "That username is already in use. Choose another one." }, 409);
      throw saveError;
    }

    return json({ ok: true, username });
  } catch (error) {
    console.error("set-username failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to save username" }, 500);
  }
});
