"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { hasStaffPermission, resolveStaffAccess } from "@/lib/rolePermissions";

export default function StaffTimetableLeadershipLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getUser();
      if (!data.user) return;
      const access = await resolveStaffAccess(client, data.user);
      if (active) setVisible(Boolean(access.organizationId) && hasStaffPermission(access.role, "school:view"));
    })();
    return () => { active = false; };
  }, []);

  if (!visible) return null;
  return <Link className="ttButton" href="/staff-timetable/leadership">Curriculum leadership</Link>;
}
