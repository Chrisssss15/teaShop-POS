# Productie-deployment Blue Cup

Voer de stappen in deze volgorde uit. Zet de MultiSafepay-productiesleutel pas
aan nadat de testbetaling en webhookcontrole zijn geslaagd.

## 1. Database

Voer in de Supabase SQL Editor uit:

`supabase/teashop_security_011_multisafepay_webhook_hardening.sql`

Beide verificatiekolommen onderaan moeten `true` zijn.

## 2. Edge Functions

Deploy daarna:

```bash
supabase functions deploy admin-users
supabase functions deploy create-customer-checkout-v2
supabase functions deploy multisafepay-webhook --no-verify-jwt
```

De webhook gebruikt geen gebruikers-JWT, omdat MultiSafepay hem rechtstreeks
aanroept. De HMAC-controle in de functie beschermt het endpoint.

## 3. Secrets voor de testomgeving

- `CUSTOMER_ALLOWED_ORIGINS=https://jouwdomein.nl`
- `MULTISAFEPAY_WEBHOOK_URL=https://<project-ref>.supabase.co/functions/v1/multisafepay-webhook`
- `MULTISAFEPAY_API_URL=https://testapi.multisafepay.com/v1/json`
- `MULTISAFEPAY_API_KEY=<test-api-key>`
- `RATE_LIMIT_SALT=<minimaal 32 willekeurige tekens>`

Gebruik bij meerdere origins een kommagescheiden lijst, bijvoorbeeld:

`https://jouwdomein.nl,https://www.jouwdomein.nl`

Gebruik geen wildcard voor een openbaar domein. Lokale origins zoals
`http://localhost:5173` en privé-IP's zoals `http://192.168.1.20:5173` worden
door de checkoutcode automatisch toegestaan voor ontwikkeling.

## 4. Supabase Auth URL Configuration

- Site URL: `https://jouwdomein.nl`
- Redirect URL: `https://jouwdomein.nl/**`
- Voeg `https://www.jouwdomein.nl/**` alleen toe als die host werkelijk wordt
  gebruikt.

Lokale redirect-URL's mogen voor ontwikkeling blijven staan.

## 5. Frontend-build

De hosting-build heeft uitsluitend deze publieke waarden nodig:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Zet nooit de service-role key of MultiSafepay API-key in de frontend of in een
Vite-variable.

## 6. Verplichte test vóór livebetalingen

1. Plaats vanuit `?mode=customer` één MultiSafepay-testbestelling.
2. Rond de betaling af en controleer dat de order naar `paid` gaat.
3. Controleer dat voor iedere beker precies één kitchen label bestaat.
4. Laat dezelfde webhook opnieuw bezorgen en controleer dat geen dubbel label
   ontstaat.
5. Test ook annuleren/teruggaan vanaf MultiSafepay.
6. Test staff-, kitchen-, display- en admin-login op het echte HTTPS-domein.

## 7. Naar echte betalingen

Pas na een geslaagde test:

- zet `MULTISAFEPAY_API_URL` op `https://api.multisafepay.com/v1/json`;
- vervang `MULTISAFEPAY_API_KEY` door de live API-key;
- voer één echte betaling met een laag bedrag uit en controleer order, payment,
  webhook en kitchen label.

Gedeeltelijke refunds zijn nog niet automatisch geboekt. Gebruik die pas nadat
hiervoor een aparte database- en boekhoudflow is toegevoegd.

## 8. Hostingbeveiliging

Stel op de uiteindelijke host minimaal HTTPS, HSTS, `X-Content-Type-Options`,
een passende Content Security Policy en clickjackingbescherming in. De exacte
configuratie hangt af van de gekozen host en de lokale printerverbindingen.
