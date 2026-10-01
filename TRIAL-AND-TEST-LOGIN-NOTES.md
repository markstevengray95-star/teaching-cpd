# School trial and test-login access

## 14-day School trial

- Trial entitlement uses `plan = school` and `status = trialing`.
- `current_period_end` is 14 days after activation.
- A self-service trial founder becomes the School Admin immediately.
- A school provisioned by the Platform Owner can be entered immediately by its specifically nominated initial School Admin after that email is confirmed.
- Other staff still require a verified school domain before automatic membership is granted.
- Existing legacy `school-trial` plan rows are normalised to `school` so trial accounts pass the same School feature gates as paid School accounts.

## Test logins

- Test credentials are created only by a Platform Owner through `/test-logins`.
- The privileged Auth Admin call runs in the `manage-test-login` Supabase Edge Function; no secret/service key is exposed to the browser.
- Test users are real Supabase Auth users and therefore work with existing RLS, course progress and school features.
- Test users are placed in the isolated `Platform Test School` organisation as School Admins with an active School entitlement.
- They are deliberately not inserted into `platform_admins`, so test credentials cannot manage real customer subscriptions or Platform Owner controls.
- Test users sign in at `/test-login` using the existing `username-login` Edge Function.
