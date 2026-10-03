import type { SupabaseClient } from "@supabase/supabase-js";

export const CURRENT_LEGAL_VERSION = "2026-10-03-v1";
export const CURRENT_LEGAL_HASH = "ff417f1077b9b846ce61d23950a1bc25fbe2d3b5f9f8c51b7f97974ba8ec64f8";
export const CURRENT_LEGAL_TITLE = "Teaching CPD Platform Terms and School Data Agreement";

export async function hasCurrentLegalAcceptance(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("document_type", "platform_terms")
    .eq("document_version", CURRENT_LEGAL_VERSION)
    .eq("document_hash", CURRENT_LEGAL_HASH)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function recordCurrentLegalAcceptance(client: SupabaseClient, userId: string, signedName: string) {
  const name = signedName.trim();
  if (name.length < 2) throw new Error("Enter your full name as your electronic signature.");
  const { error } = await client.from("legal_acceptances").insert({
    user_id: userId,
    document_type: "platform_terms",
    document_version: CURRENT_LEGAL_VERSION,
    document_hash: CURRENT_LEGAL_HASH,
    signed_name: name,
  });
  if (error && error.code !== "23505") throw error;
}
