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

function normaliseUsername(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const secretKey = pickInjectedKey("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEYS");
    const publicKey = pickInjectedKey("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEYS");
    const authorization = req.headers.get("Authorization") || "";
    if (!url || !secretKey || !publicKey || !authorization.startsWith("Bearer ")) {
      return json({ error: "Authentication service unavailable" }, 500);
    }

    const callerClient = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerAuth, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerAuth.user) return json({ error: "Sign in as Platform Owner first" }, 401);

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: platformAdmin, error: platformError } = await admin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", callerAuth.user.id)
      .maybeSingle();
    if (platformError) throw platformError;
    if (!platformAdmin) return json({ error: "Platform Owner access required" }, 403);

    const payload = await req.json().catch(() => ({}));
    const username = normaliseUsername(payload.username);
    const password = String(payload.password || "");
    const displayName = String(payload.display_name || username || "Test account").trim().slice(0, 120);

    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
      return json({ error: "Username must be 3–32 characters using letters, numbers, dots, dashes or underscores." }, 400);
    }
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

    let { data: testOrg, error: orgLookupError } = await admin
      .from("organisations")
      .select("id")
      .eq("slug", "platform-test-school")
      .maybeSingle();
    if (orgLookupError) throw orgLookupError;

    if (!testOrg) {
      const { data: createdOrg, error: createOrgError } = await admin
        .from("organisations")
        .insert({
          name: "Platform Test School",
          slug: "platform-test-school",
          academic_year: "2026/27",
          created_by: callerAuth.user.id,
          access_mode: "domain_subscription",
        })
        .select("id")
        .single();
      if (createOrgError) throw createOrgError;
      testOrg = createdOrg;
    }

    const { data: siteRows, error: siteLookupError } = await admin
      .from("school_sites")
      .select("id")
      .eq("organisation_id", testOrg.id)
      .eq("code", "TEST")
      .limit(1);
    if (siteLookupError) throw siteLookupError;
    let siteId = siteRows?.[0]?.id as string | undefined;
    if (!siteId) {
      const { data: createdSite, error: createSiteError } = await admin
        .from("school_sites")
        .insert({ organisation_id: testOrg.id, name: "Test Site", code: "TEST", created_by: callerAuth.user.id })
        .select("id")
        .single();
      if (createSiteError) throw createSiteError;
      siteId = createdSite.id;
    }

    const { error: subscriptionError } = await admin
      .from("school_subscriptions")
      .upsert({
        organisation_id: testOrg.id,
        plan: "school",
        status: "active",
        provider: "manual",
        seat_limit: null,
        current_period_start: new Date().toISOString(),
        current_period_end: "2099-12-31T23:59:59.000Z",
        grace_until: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organisation_id" });
    if (subscriptionError) throw subscriptionError;

    const { data: existingProfile, error: usernameLookupError } = await admin
      .from("staff_development_profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (usernameLookupError) throw usernameLookupError;

    let userId = existingProfile?.user_id as string | undefined;
    let created = false;
    if (userId) {
      const { data: existingUser, error: existingUserError } = await admin.auth.admin.getUserById(userId);
      if (existingUserError) throw existingUserError;
      if (existingUser.user?.app_metadata?.platform_test_user !== true) {
        return json({ error: "That username is already used by a normal account. Choose another username." }, 409);
      }
      const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { ...(existingUser.user.user_metadata || {}), full_name: displayName, username },
        app_metadata: { ...(existingUser.user.app_metadata || {}), platform_test_user: true, staff_development_role: "admin" },
      });
      if (updateUserError) throw updateUserError;
    } else {
      const email = `${username}@test.schoolcpd.app`;
      const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName, username },
      });
      if (createUserError || !createdUser.user) throw createUserError || new Error("Unable to create test user");
      userId = createdUser.user.id;
      created = true;
      const { error: appMetadataError } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...(createdUser.user.app_metadata || {}), platform_test_user: true, staff_development_role: "admin" },
      });
      if (appMetadataError) throw appMetadataError;
    }

    const { error: staffProfileError } = await admin
      .from("staff_profiles")
      .upsert({
        id: userId,
        full_name: displayName,
        role: "Admin",
        department: "Testing",
        organisation_id: testOrg.id,
        site_id: siteId,
        legacy_standalone_access: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    if (staffProfileError) throw staffProfileError;

    const { error: membershipError } = await admin
      .from("organisation_memberships")
      .upsert({
        organisation_id: testOrg.id,
        user_id: userId,
        site_id: siteId,
        member_role: "org_admin",
        active: true,
      }, { onConflict: "organisation_id,user_id" });
    if (membershipError) throw membershipError;

    const { error: combinedProfileError } = await admin
      .from("staff_development_profiles")
      .upsert({
        user_id: userId,
        display_name: displayName,
        department: "Testing",
        preferred_organization_id: testOrg.id,
        username,
        platform_role: "admin",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (combinedProfileError) throw combinedProfileError;

    return json({
      ok: true,
      created,
      username,
      display_name: displayName,
      access: "Full test-school Admin access",
    });
  } catch (error) {
    console.error("manage-test-login failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to create test login" }, 500);
  }
});
