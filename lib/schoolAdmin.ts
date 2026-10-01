import type { SupabaseClient } from "@supabase/supabase-js";
export type SchoolAdminProfile={id:string;full_name:string;role:string;organisation_id:string|null};
export async function schoolAdminProfile(client:SupabaseClient,next:string):Promise<SchoolAdminProfile> {
  const {data:auth,error}=await client.auth.getUser();
  if(error&&error.name!=="AuthSessionMissingError") throw new Error("Sign-in check failed. Please retry.");
  if(!auth.user) {window.location.replace("/auth?next="+encodeURIComponent(next));throw new Error("Sign in with your school account.");}
  const {data:profile,error:profileError}=await client.from("staff_profiles").select("id,full_name,role,organisation_id").eq("id",auth.user.id).single();
  if(profileError||!profile) throw new Error("Unable to load your school profile.");
  if(!["Admin","CPD Lead"].includes(profile.role)) throw new Error("School Admin or CPD Lead access is required.");
  return profile as SchoolAdminProfile;
}
