import type { SupabaseClient, User } from "@supabase/supabase-js";

export type StaffRole =
  | "teacher"
  | "tutor"
  | "hod"
  | "pastoral"
  | "send-eal"
  | "slt"
  | "administrator"
  | "support"
  | "super-admin";

export type StaffPermission =
  | "teach:view"
  | "students:view"
  | "students:manage"
  | "develop:view"
  | "school:view"
  | "school:manage"
  | "cpd:manage"
  | "admin:manage"
  | "platform:manage";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  teacher: "Teacher",
  tutor: "Tutor",
  hod: "Head of Department",
  pastoral: "Pastoral Lead",
  "send-eal": "SEND / EAL",
  slt: "SLT",
  administrator: "Administrator",
  support: "Support Staff",
  "super-admin": "Super Admin",
};

const ROLE_PERMISSIONS: Record<StaffRole, StaffPermission[]> = {
  teacher: ["teach:view", "students:view", "develop:view"],
  tutor: ["teach:view", "students:view", "develop:view"],
  hod: ["teach:view", "students:view", "develop:view", "school:view", "school:manage", "cpd:manage"],
  pastoral: ["teach:view", "students:view", "students:manage", "develop:view", "school:view"],
  "send-eal": ["teach:view", "students:view", "students:manage", "develop:view", "school:view"],
  slt: ["teach:view", "students:view", "students:manage", "develop:view", "school:view", "school:manage", "cpd:manage", "admin:manage"],
  administrator: ["teach:view", "students:view", "students:manage", "develop:view", "school:view", "school:manage", "cpd:manage", "admin:manage"],
  support: ["students:view", "develop:view"],
  "super-admin": ["teach:view", "students:view", "students:manage", "develop:view", "school:view", "school:manage", "cpd:manage", "admin:manage", "platform:manage"],
};

const PUBLIC_PATHS = ["/auth", "/reset-password", "/admin-login", "/owner-login", "/access-denied", "/verify", "/join"];

const ROUTE_PERMISSIONS: Array<[string, StaffPermission]> = [
  ["/owner-portal", "platform:manage"],
  ["/platform", "platform:manage"],
  ["/admin-centre", "admin:manage"],
  ["/admin", "platform:manage"],
  ["/staff-access", "admin:manage"],
  ["/staff-sync", "admin:manage"],
  ["/organisation", "admin:manage"],
  ["/school-access", "admin:manage"],
  ["/launch-readiness", "admin:manage"],
  ["/ai-course-builder", "cpd:manage"],
  ["/builder", "cpd:manage"],
  ["/course-studio", "cpd:manage"],
  ["/course-audit", "cpd:manage"],
  ["/course-quality-dashboard", "cpd:manage"],
  ["/presentation-overhaul-final", "cpd:manage"],
  ["/quality", "cpd:manage"],
  ["/facilitator", "cpd:manage"],
  ["/live-presenter", "cpd:manage"],
  ["/improvement/programmes", "school:manage"],
  ["/leadership-dashboard", "school:view"],
  ["/department-analytics", "school:view"],
  ["/school-improvement", "school:view"],
  ["/leadership", "school:view"],
  ["/school-hub", "school:view"],
  ["/school", "school:view"],
  ["/improvement", "school:view"],
  ["/learning-walks", "school:view"],
  ["/zones-school", "school:view"],
  ["/department-plans", "teach:view"],
  ["/teaching-learning", "teach:view"],
  ["/resource-generator", "teach:view"],
  ["/department-hub", "teach:view"],
  ["/curriculum", "teach:view"],
  ["/teach", "teach:view"],
  ["/interventions", "students:view"],
  ["/send-eal", "students:view"],
  ["/regulation-behaviour", "students:view"],
  ["/pastoral", "students:view"],
  ["/students", "students:view"],
  ["/professional-learning", "develop:view"],
  ["/portfolio", "develop:view"],
  ["/coaching", "develop:view"],
  ["/appraisal", "develop:view"],
  ["/notices", "develop:view"],
  ["/calendar", "develop:view"],
  ["/directory", "develop:view"],
  ["/forms", "develop:view"],
  ["/trips", "develop:view"],
  ["/resource-library", "develop:view"],
  ["/policies", "develop:view"],
  ["/search", "develop:view"],
  ["/school-assistant", "develop:view"],
  ["/recommendations", "develop:view"],
  ["/needs-audit", "develop:view"],
  ["/induction", "develop:view"],
  ["/compliance", "develop:view"],
  ["/recognition", "develop:view"],
  ["/staff-voice", "develop:view"],
  ["/files", "develop:view"],
  ["/notifications", "develop:view"],
  ["/integrations", "develop:view"],
  ["/develop", "develop:view"],
];

export function hasStaffPermission(role: StaffRole, permission: StaffPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionForPath(pathname: string): StaffPermission | null {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  const match = [...ROUTE_PERMISSIONS]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] || null;
}

export function normaliseStaffRole(value: unknown): StaffRole {
  const role = String(value || "").trim().toLowerCase();
  if (["super-admin", "super_admin", "platform admin", "platform_admin"].includes(role)) return "super-admin";
  if (["administrator", "admin", "owner"].includes(role)) return "administrator";
  if (["slt", "leader", "senior leader", "senior_leader"].includes(role)) return "slt";
  if (["hod", "head of department", "department lead", "department_lead", "cpd lead", "cpd_lead"].includes(role)) return "hod";
  if (["pastoral", "pastoral lead", "pastoral_lead"].includes(role)) return "pastoral";
  if (["send-eal", "send_eal", "send / eal", "send/eal", "send", "eal"].includes(role)) return "send-eal";
  if (["tutor", "form tutor"].includes(role)) return "tutor";
  if (["support", "support staff", "support_staff", "teaching assistant"].includes(role)) return "support";
  return "teacher";
}

export type ResolvedStaffAccess = {
  role: StaffRole;
  organizationId: string | null;
  platformAdmin: boolean;
  source: "platform" | "assignment" | "membership" | "legacy" | "default";
};

export async function resolveStaffAccess(client: SupabaseClient, user: User): Promise<ResolvedStaffAccess> {
  const trustedPlatformClaim = user.app_metadata?.platform_admin === true || user.app_metadata?.zones_role === "admin";

  const [{ data: profile }, { data: platformRow }] = await Promise.all([
    client
      .from("staff_development_profiles")
      .select("preferred_organization_id,platform_role")
      .eq("user_id", user.id)
      .maybeSingle(),
    client.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const platformAdmin = trustedPlatformClaim || profile?.platform_role === "admin" || Boolean(platformRow);
  if (platformAdmin) {
    return {
      role: "super-admin",
      organizationId: profile?.preferred_organization_id || null,
      platformAdmin: true,
      source: "platform",
    };
  }

  let organizationId = profile?.preferred_organization_id || null;
  let membershipRole: string | null = null;

  if (!organizationId) {
    const { data: owned } = await client
      .from("school_organizations")
      .select("id")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (owned?.id) {
      organizationId = owned.id;
      membershipRole = "owner";
    }
  }

  if (!organizationId) {
    const { data: membership } = await client
      .from("school_organization_members")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (membership) {
      organizationId = membership.organization_id;
      membershipRole = membership.role || null;
    }
  }

  if (organizationId) {
    const { data: assignment, error: assignmentError } = await client
      .from("staff_development_role_assignments")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!assignmentError && assignment?.role) {
      return {
        role: normaliseStaffRole(assignment.role),
        organizationId,
        platformAdmin: false,
        source: "assignment",
      };
    }

    if (!membershipRole) {
      const { data: membership } = await client
        .from("school_organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .maybeSingle();
      membershipRole = membership?.role || null;
    }

    if (membershipRole) {
      return {
        role: normaliseStaffRole(membershipRole),
        organizationId,
        platformAdmin: false,
        source: "membership",
      };
    }
  }

  const { data: legacyProfile } = await client
    .from("staff_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (legacyProfile?.role) {
    return {
      role: normaliseStaffRole(legacyProfile.role),
      organizationId,
      platformAdmin: false,
      source: "legacy",
    };
  }

  return { role: "teacher", organizationId, platformAdmin: false, source: "default" };
}
