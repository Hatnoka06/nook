# Backup and restore

**Backup:** Settings → *Export all data (JSON)*. You get `uniflow-export-YYYY-MM-DD.json` (every table, ids kept, soft-deleted rows excluded).

**Restore into a project (empty or existing):**
```bash
SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY \
TARGET_USER_ID=UUID-OF-YOUR-AUTH-USER \
npx tsx scripts/restore.ts uniflow-export-2026-11-21.json
```
`TARGET_USER_ID` is in Supabase → Authentication → Users. Rows are upserted by id, so running it twice does not duplicate anything. The service_role key never goes in the app or in git.
