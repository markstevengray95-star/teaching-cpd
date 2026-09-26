import type { SupabaseClient } from "@supabase/supabase-js";

export type SchoolAccessReason =
  | "existing_membership"
  | "domain_matched"
  | "legacy_standalone"
  | "school_not_licensed"
  | "subscription_inactive"
  | "seat_limit_reached"
  | "missing_email"
  | "email_not_verified"
  | "access_check_failed";

export type SchoolAccessResult = {
  allowed: boolean;
  reason: SchoolAccessReason | string;
  organisation_id?: string;
  domain?: string;
};

export async function claimSchoolAccess(client: SupabaseClient): Promise<SchoolAccessResult> {
  const { data, error } = await client.rpc("claim_school_access");
  if (error) throw error;
  const value = (data || {}) as Partial<SchoolAccessResult>;
  return {
    allowed: Boolean(value.allowed),
    reason: value.reason || "access_check_failed",
    ...(value.organisation_id ? { organisation_id: value.organisation_id } : {}),
    ...(value.domain ? { domain: value.domain } : {}),
  };
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/auth") || value.startsWith("/access")) return "/";
  return value;
}

export function accessReasonMessage(reason: string) {
  switch (reason) {
    case "school_not_licensed":
      return "Your school email is not linked to an active Teaching CPD subscription yet. Ask your school CPD lead to confirm the subscription and verified email domain.";
    case "subscription_inactive":
      return "Your school's Teaching CPD subscription is not currently active. Your CPD records remain stored, but access is paused until the subscription is reactivated.";
    case "seat_limit_reached":
      return "Your school's current licence has reached its staff limit. Ask your CPD lead or school administrator to update the subscription.";
    case "missing_email":
      return "Your sign-in provider did not return a usable school email address. Try a different school sign-in method or contact your school administrator.";
    case "email_not_verified":
      return "Your school email has not been verified yet. Complete the verification step from your email provider, then return and check access again.";
    default:
      return "We could not confirm school access for this account. Retry the check, or ask your school CPD lead to verify the school's subscription and email domain.";
  }
}
