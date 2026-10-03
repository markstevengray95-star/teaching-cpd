import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase";

type ApiAuthSuccess = { ok: true; user: User; client: SupabaseClient };
type ApiAuthFailure = { ok: false; response: Response };
export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

function bearerToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
}

export async function requireApiUser(request: Request): Promise<ApiAuthResult> {
  const token = bearerToken(request);
  if (!token) return { ok: false, response: Response.json({ error: "Sign in is required." }, { status: 401 }) };

  const { url, key } = getSupabasePublicConfig();
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { ok: false, response: Response.json({ error: "Your session could not be verified." }, { status: 401 }) };
  return { ok: true, user: data.user, client };
}

export async function requireApiRoles(request: Request, roles: string[]): Promise<ApiAuthResult> {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth;
  const { data, error } = await auth.client.from("staff_profiles").select("role").eq("id", auth.user.id).maybeSingle();
  if (error || !data?.role || !roles.includes(String(data.role))) {
    return { ok: false, response: Response.json({ error: "You do not have permission to use this AI service." }, { status: 403 }) };
  }
  return auth;
}
