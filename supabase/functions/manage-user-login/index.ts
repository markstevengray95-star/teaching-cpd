import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.117.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACCESS = {
  staff: { role: "Staff", memberRole: "member", active: true, label: "Staff" },
  department_lead: { role: "Department Lead", memberRole: "member", active: true, label: "Department Lead" },
  cpd_lead: { role: "CPD Lead", memberRole: "org_admin", active: true, label: "CPD Lead" },
  admin: { role: "Admin", memberRole: "org_admin", active: true, label: "Full school admin" },
  disabled: { role: "Staff", memberRole: "member", active: false, label: "Disabled" },
} as const;

type AccessKey = keyof typeof ACCESS;

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

function isManagedUser(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.platform_managed_user === true || user?.app_metadata?.platform_test_user === true;
}

async function ensureManagedOrganisation(admin: ReturnType<typeof createClient>, callerId: string) {
  let { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .select("id")
    .eq("slug", "platform-managed-access")
    .maybeSingle();
  if (organisationError) throw organisationError;

  if (!organisation) {
    const { data: created, error } = await admin
      .from("organisations")
      .insert({
        name: "Platform Managed Access",
        slug: "platform-managed-access",
        academic_year: "2026/27",
        created_by: callerId,
        access_mode: "domain_subscription",
      })
      .select("id")
      .single();
    if (error) throw error;
    organisation = created;
  }

  const { data: sites, error: siteLookupError } = await admin
    .from("school_sites")
    .select("id")
    .eq("organisation_id", organisation.id)
    .eq("code", "MANAGED")
    .limit(1);
  if (siteLookupError) throw siteLookupError;

  let siteId = sites?.[0]?.id as string | undefined;
  if (!siteId) {
    const { data: createdSite, error: siteError } = await admin
      .from("school_sites")
      .insert({ organisation_id: organisation.id, name: "Managed Access", code: "MANAGED", created_by: callerId })
      .select("id")
      .single();
    if (siteError) throw siteError;
    siteId = createdSite.id;
  }

  const { error: subscriptionError } = await admin
    .from("school_subscriptions")
    .upsert({
      organisation_id: organisation.id,
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

  return { organisationId: organisation.id as string, siteId };
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

    const caller = createClient(url, publicKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: callerAuth, error: callerError } = await caller.auth.getUser();
    if (callerError || !callerAuth.user) return json({ error: "Sign in as Platform Owner first" }, 401);

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: owner, error: ownerError } = await admin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", callerAuth.user.id)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner) return json({ error: "Platform Owner access required" }, 403);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload.action || "upsert");
    const managed = await ensureManagedOrganisation(admin, callerAuth.user.id);

    if (action === "list") {
      const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      const managedUsers = usersPage.users.filter(isManagedUser);
      const ids = managedUsers.map(user => user.id);
      if (!ids.length) return json({ ok: true, accounts: [] });

      const [{ data: usernameRows, error: usernamesError }, { data: staffRows, error: staffError }, { data: membershipRows, error: membershipsError }] = await Promise.all([
        admin.from("staff_development_profiles").select("user_id,username,display_name").in("user_id", ids),
        admin.from("staff_profiles").select("id,role").in("id", ids),
        admin.from("organisation_memberships").select("user_id,active").eq("organisation_id", managed.organisationId).in("user_id", ids),
      ]);
      if (usernamesError) throw usernamesError;
      if (staffError) throw staffError;
      if (membershipsError) throw membershipsError;

      const usernameById = new Map((usernameRows || []).map(row => [row.user_id, row]));
      const staffById = new Map((staffRows || []).map(row => [row.id, row]));
      const membershipById = new Map((membershipRows || []).map(row => [row.user_id, row]));

      const accounts = managedUsers.map(user => {
        const usernameRow = usernameById.get(user.id);
        const staff = staffById.get(user.id);
        const membership = membershipById.get(user.id);
        const active = membership?.active !== false;
        let accessLevel: AccessKey = "staff";
        if (!active) accessLevel = "disabled";
        else if (staff?.role === "Admin") accessLevel = "admin";
        else if (staff?.role === "CPD Lead") accessLevel = "cpd_lead";
        else if (staff?.role === "Department Lead") accessLevel = "department_lead";
        return {
          user_id: user.id,
          username: usernameRow?.username || user.user_metadata?.username || "",
          display_name: usernameRow?.display_name || user.user_metadata?.full_name || "Managed user",
          access_level: accessLevel,
          access_label: ACCESS[accessLevel].label,
          active,
        };
      }).filter(account => account.username).sort((a, b) => a.username.localeCompare(b.username));

      return json({ ok: true, accounts });
    }

    const username = normaliseUsername(payload.username);
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
      return json({ error: "Username must be 3–32 characters using letters, numbers, dots, dashes or underscores." }, 400);
    }

    const accessLevel = String(payload.access_level || "staff") as AccessKey;
    const access = ACCESS[accessLevel];
    if (!access) return json({ error: "Choose a valid access level." }, 400);

    if (action === "set_access") {
      const { data: profile, error: profileError } = await admin
        .from("staff_development_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.user_id) return json({ error: "Managed username not found." }, 404);

      const { data: existingUser, error: userError } = await admin.auth.admin.getUserById(profile.user_id);
      if (userError) throw userError;
      if (!isManagedUser(existingUser.user)) return json({ error: "That username belongs to a normal account and cannot be managed here." }, 409);

      const { error: staffError } = await admin.from("staff_profiles").upsert({
        id: profile.user_id,
        role: access.role,
        organisation_id: managed.organisationId,
        site_id: managed.siteId,
        legacy_standalone_access: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (staffError) throw staffError;

      const { error: membershipError } = await admin.from("organisation_memberships").upsert({
        organisation_id: managed.organisationId,
        user_id: profile.user_id,
        site_id: managed.siteId,
        member_role: access.memberRole,
        active: access.active,
      }, { onConflict: "organisation_id,user_id" });
      if (membershipError) throw membershipError;

      await admin.auth.admin.updateUserById(profile.user_id, {
        app_metadata: {
          ...(existingUser.user?.app_metadata || {}),
          platform_managed_user: true,
          platform_test_user: false,
          platform_managed_access: accessLevel,
        },
      });

      return json({ ok: true, username, access_level: accessLevel, access_label: access.label });
    }

    const password = String(payload.password || "");
    const displayName = String(payload.display_name || username || "Managed user").trim().slice(0, 120);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

    const { data: reserved, error: reservedError } = await admin
      .from("staff_development_reserved_usernames")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    if (reservedError) throw reservedError;
    if (reserved) return json({ error: "That username is reserved. Choose another username." }, 409);

    const { data: existingProfile, error: usernameError } = await admin
      .from("staff_development_profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (usernameError) throw usernameError;

    const syntheticEmail = `${username}@managed.schoolcpd.app`;
    let userId = existingProfile?.user_id as string | undefined;
    let created = false;

    if (!userId) {
      const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      const orphan = usersPage.users.find(user => user.email?.toLowerCase() === syntheticEmail.toLowerCase());
      if (orphan) {
        if (!isManagedUser(orphan)) return json({ error: "That username conflicts with an existing account." }, 409);
        userId = orphan.id;
      }
    }

    if (userId) {
      const { data: existingUser, error: existingUserError } = await admin.auth.admin.getUserById(userId);
      if (existingUserError) throw existingUserError;
      if (!isManagedUser(existingUser.user)) {
        return json({ error: "That username is already used by a normal account. Choose another username." }, 409);
      }
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { ...(existingUser.user?.user_metadata || {}), full_name: displayName, username },
        app_metadata: {
          ...(existingUser.user?.app_metadata || {}),
          platform_managed_user: true,
          platform_test_user: false,
          platform_managed_access: accessLevel,
        },
      });
      if (updateError) throw updateError;
    } else {
      const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName, username },
        app_metadata: { platform_managed_user: true, platform_test_user: false, platform_managed_access: accessLevel },
      });
      if (createError || !createdUser.user) throw createError || new Error("Unable to create managed user");
      userId = createdUser.user.id;
      created = true;
    }

    const { error: staffProfileError } = await admin.from("staff_profiles").upsert({
      id: userId,
      full_name: displayName,
      role: access.role,
      department: "Managed Access",
      organisation_id: managed.organisationId,
      site_id: managed.siteId,
      legacy_standalone_access: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (staffProfileError) throw staffProfileError;

    const { error: membershipError } = await admin.from("organisation_memberships").upsert({
      organisation_id: managed.organisationId,
      user_id: userId,
      site_id: managed.siteId,
      member_role: access.memberRole,
      active: access.active,
    }, { onConflict: "organisation_id,user_id" });
    if (membershipError) throw membershipError;

    const { error: compatibilityError } = await admin.from("staff_development_profiles").upsert({
      user_id: userId,
      display_name: displayName,
      department: "Managed Access",
      preferred_organization_id: null,
      username,
      platform_role: "user",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (compatibilityError) throw compatibilityError;

    return json({
      ok: true,
      created,
      username,
      display_name: displayName,
      access_level: accessLevel,
      access_label: access.label,
    });
  } catch (error) {
    console.error("manage-user-login failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to manage login" }, 500);
  }
});
