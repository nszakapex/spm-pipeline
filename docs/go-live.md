# Go live — HubSpot in, everything else optional

Demo data stays fake until you paste HubSpot credentials. The ingest path, subscriptions, and manual call/reply log are already in the app. You should not need a new architecture session.

## What you bring

1. **HubSpot app client secret** → Vercel env `HUBSPOT_CLIENT_SECRET`  
   This turns on HubSpot **v3 webhook signatures**. It is not an access token and does **not** enable `HUBSPOT_MODE=live` (outbound CRM writes stay off).
2. Optional: **Jake’s HubSpot Meetings URL** → `JAKE_MEETINGS_URL`  
   Shows “Open Jake’s Meetings link” on the lead. When they book, HubSpot hits this app.
3. In the HubSpot app: create a webhook pointing at  
   `https://spm-pipeline.vercel.app/api/webhooks/hubspot`

### Subscriptions to create (already listed in the app)

- `contact.creation`
- `contact.propertyChange`: `email`, `phone`, `firstname`, `lastname`, `lifecyclestage`, `hubspot_owner_id`, `hs_lead_status`
- `deal.propertyChange`: `dealstage`
- `meeting.creation`
- meeting outcome / `meeting.propertyChange` for completed, no-show, canceled

Creation payloads have no email. Identity arrives on the property-change events. That path is covered by smoke tests.

## What you do not need on day one

- Dialer
- Twilio / iMessage
- `HUBSPOT_MODE=live`
- Supabase Auth

Calls, iMessage, and personal Gmail: open the lead → **Log what you just did** → Save to pipeline.

Manual logs also write a signed demo cookie (`spm_activity`) as a same-browser backup.

## Supabase persist (wired)

A free Supabase project **spm-pipeline** is attached via Vercel Marketplace (`iad1`, project ref `hwndeqjqjprbqqtgoxbn`). Production and Preview have the connection env vars. Overlay tables (`pipeline_*`) store ingest + manual logs with text IDs (`lead_001`, new HubSpot contacts). The service-role key writes server-side only; RLS is on with no anon/authenticated policies.

Request handlers hydrate that overlay, then apply ingest in memory, then persist the snapshot. A 9pm email or new contact is still there in the morning. The cookie is a fallback if persist is unset (local tests). `/api/health` reports `persistReady`. Do not switch `APP_MODE=auth`. HubSpot is still mock until you paste the client secret.

## Smoke tests (run anytime, no HubSpot login)

```bash
npm test
npm run smoke:webhooks
```

`smoke:webhooks` walks:

1. HubSpot `contact.creation` (object id only) → New lead  
2. `propertyChange` email/name → identity filled  
3. lifecycle SQL → Qualified  
4. meeting booked → Call Booked; completed → Call Held  
5. Typed voicemail → Attempting Contact  
6. Typed inbound reply → Connected + Needs reply  
7. `/api/health` shows what you still need to paste  
8. A synthetic HubSpot **v3** signed POST (with a test secret)

Check readiness without tests:

```bash
curl -sS https://spm-pipeline.vercel.app/api/health
```

`webhooks.hubspotV3Ready` is `false` until `HUBSPOT_CLIENT_SECRET` is set. `waitingOnYou` lists the missing HubSpot env names only. `persistReady` is `true` on Vercel when overlay persist credentials are present.

GET `/api/webhooks/hubspot` prints the subscription catalog.

## After the secret is in Vercel

1. Redeploy (or wait for the env to attach).  
2. `curl /api/health` → `hubspotV3Ready: true`.  
3. In HubSpot, send a test webhook.  
4. Open **Integrations** — ingest receipts. Open the lead — timeline / stage.

Outbound HubSpot API (pushing SPM fields back) is still a later switch. Inbound HubSpot + manual logs are enough to run the board.
