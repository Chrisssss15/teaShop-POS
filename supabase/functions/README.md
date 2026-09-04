# Supabase Edge Functions

De actuele Edge Functions staan ieder in hun eigen map:

- `admin-users/index.ts`
- `create-customer-checkout-v2/index.ts`
- `multisafepay-webhook/index.ts`

## Secrets

De volgende waarden horen in Supabase Edge Function Secrets en nooit in een
frontend `.env`-bestand:

- `MULTISAFEPAY_API_KEY`
- `MULTISAFEPAY_WEBHOOK_URL`
- `MULTISAFEPAY_API_URL`
- `RATE_LIMIT_SALT` (minimaal 32 tekens)
- `CUSTOMER_ALLOWED_ORIGINS`

`SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` worden normaal door Supabase aan
Edge Functions beschikbaar gesteld.

## Deployen

Voor een nieuwe database is de checkout-rate-limit afhankelijk van:

`supabase/teashop_security_009_edge_rate_limits.sql`

Deze beveiliging is in het huidige liveproject al eerder uitgevoerd en getest.

Voer vóór de bijgewerkte webhookdeployment dit nieuwe bestand uit in de
Supabase SQL Editor:

`supabase/teashop_security_011_multisafepay_webhook_hardening.sql`

```bash
supabase functions deploy admin-users
supabase functions deploy create-customer-checkout-v2
supabase functions deploy multisafepay-webhook --no-verify-jwt
```

De webhook ontvangt verzoeken van MultiSafepay en kan daarom geen Supabase
gebruikers-JWT vereisen. De webhook controleert zelf de MultiSafepay HMAC.

Controleer na deployment altijd eerst met MultiSafepay-testmodus voordat de
productie-API wordt ingesteld.

De geharde webhook:

- controleert de HMAC voordat de JSON wordt verwerkt;
- controleert het bedrag en de valuta tegen de lokale payment;
- laat `paid` niet terugvallen naar `pending`, `failed` of `cancelled`;
- behandelt herhaalde meldingen zonder dubbele kitchen-labels;
- markeert `shipped` niet ten onrechte als betaald.

Gedeeltelijke refunds worden bewust niet automatisch verwerkt zolang daarvoor
geen aparte boekhoudkundige status/flow in de database bestaat. Zo kan een
gedeeltelijke refund niet onterecht als volledig betaald of volledig refunded
worden geboekt.

De publieke checkout:

- weigert onbekende browser-origins voordat een order wordt aangemaakt;
- staat `localhost` en privé-netwerk-IP's toe voor lokale ontwikkeling;
- vereist voor een openbaar domein een exacte HTTPS-origin in
  `CUSTOMER_ALLOWED_ORIGINS`;
- begrenst requestgroottes en het aantal verzoeken per IP/request-id.
