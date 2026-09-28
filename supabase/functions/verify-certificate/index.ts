// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ valid: false, error: "Method not allowed" }, 405);

  let body: { reference?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ valid: false, error: "Invalid request" }, 400);
  }

  const reference = String(body.reference || "").trim().toUpperCase();
  if (!/^CPD-[0-9]{8}-[A-Z0-9]{7,16}$/.test(reference)) {
    return json({ valid: false, error: "Certificate reference format is invalid" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ valid: false, error: "Verification service unavailable" }, 503);

  const query = new URL(`${supabaseUrl}/rest/v1/cpd_certificates`);
  query.searchParams.set("certificate_ref", `eq.${reference}`);
  query.searchParams.set("status", "eq.active");
  query.searchParams.set("select", "certificate_ref,course_id,completed_at,recipient_name_snapshot,organisation_name_snapshot,issued_at");
  query.searchParams.set("limit", "1");

  const result = await fetch(query, {
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      Accept: "application/json",
    },
  });

  if (!result.ok) return json({ valid: false, error: "Verification service unavailable" }, 503);
  const rows = await result.json();
  const certificate = Array.isArray(rows) ? rows[0] : null;
  if (!certificate) return json({ valid: false, reference, error: "Certificate not found or no longer valid" }, 404);

  return json({
    valid: true,
    certificate: {
      reference: certificate.certificate_ref,
      courseId: certificate.course_id,
      completedAt: certificate.completed_at,
      recipientName: certificate.recipient_name_snapshot,
      organisationName: certificate.organisation_name_snapshot,
      issuedAt: certificate.issued_at,
    },
  });
});
