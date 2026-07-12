# Supabase Family Sync

Family Schedule Hub can share one family schedule across iPhone, iPad, and PC through Supabase.

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. In Vercel Project Settings, add these Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FAMILY_SYNC_ID=family-schedule-hub
```

4. Redeploy Vercel.
5. Open the app on one device and save a schedule once. Other devices will pull the shared data from Supabase when the page opens.

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` must be added only in Vercel/server environment. Do not expose it as `NEXT_PUBLIC_...`.
- The first sync stores the whole app state in `public.family_app_states`.
- Local `localStorage` remains as offline cache, so the app still opens even when the network is unavailable.
