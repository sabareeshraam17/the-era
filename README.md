# THE ERA — Vercel + Neon version

This package is ready for Vercel with a persistent Neon Postgres order database.

## What it includes
- THE ERA storefront
- The Era brand story page
- Cart and checkout
- COD and UPI selection
- Order success page
- Owner login
- Owner dashboard at `/admin`
- Search, date/status filters, revenue stats
- Order status: NEW, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
- CSV export
- Server-side order storage in Neon Postgres

## Vercel setup
1. Upload/push this package's contents to the GitHub `the-era` repository.
2. In Vercel, import the repository.
3. Add the Neon integration to the Vercel project. Vercel's Neon integration provisions/connects a serverless Postgres database and provides the database connection environment variable. See Vercel's Neon integration docs.
4. Add these Vercel environment variables:
   - `ADMIN_PASSWORD` = your private owner password
   - `SESSION_SECRET` = a long random secret
   - `DATABASE_URL` = supplied by the Neon integration
5. Deploy.

The API creates the `orders` table automatically on first use.

UPI is currently an order/payment option and UPI-ID collection; it is not a live payment gateway.
