# Supabase bronbestanden

## Belangrijk

`rls_security_mvp.sql` is een historisch consolidatiescript. Gebruik dit
bestand niet als enige migratie voor een nieuwe productieomgeving. Het huidige
liveproject bevat latere beveiligingswijzigingen die nog uit Supabase moeten
worden geëxporteerd.

Voor het huidige liveproject:

1. Voer `teashop_security_011_multisafepay_webhook_hardening.sql` uit.
2. Controleer dat beide verificatiekolommen `true` zijn.
3. Deploy daarna de bijgewerkte `multisafepay-webhook`.
4. Deploy daarna de bijgewerkte `create-customer-checkout-v2` en `admin-users`.

`teashop_security_009_edge_rate_limits.sql` is al in het huidige liveproject
toegepast en staat hier om de broncode compleet te houden.

## Nog exporteren voor herstelbaarheid

De exacte actuele definities van `create_customer_order` en
`get_customer_order_status_v2` staan wel in het liveproject, maar nog niet als
migratiebestand in deze map. Voer `export_current_rpc_definitions.sql` uit in
de Supabase SQL Editor en bewaar/exporteer het resultaat voordat je een nieuwe
database vanaf nul probeert op te bouwen.
