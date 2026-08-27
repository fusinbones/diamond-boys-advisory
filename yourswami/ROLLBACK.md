# Rollback: SMS opt-in deploy (2026-08-23)

## The point to roll back to

| | |
|---|---|
| Vercel deployment | `dpl_GXGU1YrVPjpv62gYmhscQPpWdMS1` |
| Deployed | 2026-08-16 01:16:27 UTC |
| URL | `yourswami-8ygsqkga3-mejconsulting.vercel.app` |
| Git commit | `d7da171` |
| Git tag | `pre-sms-deploy` (pushed to `automationbytehreem/yourswami`) |
| Vercel project | `yourswami` / `prj_HhzxvKTRA2NTUO9GVRuzcNDO1rhc` |
| Vercel team | `mejconsulting` / `team_EAzw76Ae1sIlsn3bNGjnxuPF` |

## Rolling back

**Fastest, no rebuild.** Vercel dashboard, project `yourswami`, Deployments tab,
find the 2026-08-16 deployment above, "Promote to Production". Takes seconds
because the build already exists.

Or from the CLI:

```bash
npx vercel promote dpl_GXGU1YrVPjpv62gYmhscQPpWdMS1 \
  --token <VERCEL_TOKEN> --scope mejconsulting
```

**From source**, if the deployment has been pruned:

```bash
git checkout pre-sms-deploy
npx vercel deploy --prod --force --yes --token <VERCEL_TOKEN> --scope mejconsulting
```

## What a rollback does and does not undo

Reverting the deployment restores the previous **code**. It does not touch these,
which are set outside the build:

- **The three GHL env vars on Vercel Production** (`GHL_API_TOKEN`,
  `GHL_LOCATION_ID`, `GHL_OPTIN_TAG`). Harmless if left: the old code never reads
  them. Remove them in project Settings if you want a truly clean revert.
- **Contacts already created in GHL.** Anyone who signed up and consented while
  the new code was live stays in GHL carrying `website-signup` and possibly
  `sms-optin`. A rollback does not untag them, so the pick blast would still
  reach them if the new code is redeployed later. To clear: strip the `sms-optin`
  tag on those contacts in GHL.
- **Consent stored in Supabase `user_metadata`** (`sms_consent`,
  `sms_consent_at`, `sms_age_confirmed`, `phone`). Keep this. It is the record of
  who consented and when, and deleting it destroys the audit trail even though
  the feature is off.
- **The A2P campaign fields**, if already updated in GHL. Independent of the
  deploy; revert them in GHL if the site no longer offers the signup opt-in.

## Note on the footer image

`public/brand/footer-banner.webp` was replaced in this deploy. The previous
version is recoverable from git:

```bash
git show pre-sms-deploy:public/brand/footer-banner.webp > footer-banner-old.webp
```
