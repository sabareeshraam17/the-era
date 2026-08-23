# THE ERA — Full Store + Owner Dashboard

This version stores orders in a real SQLite database on the server, so the owner can see orders placed by customers on other devices.

## Owner features
- Private owner login
- Orders dashboard
- Total orders, new orders, revenue, delivered count
- Search by order/customer/phone/email/product
- Date and status filters
- Full customer delivery details
- Product quantities and totals
- COD / UPI details
- Status buttons: Confirmed, Shipped, Delivered, Cancelled
- CSV export

## Run locally
1. Install Node.js LTS.
2. Copy `.env.example` to `.env` and set a strong `ADMIN_PASSWORD` and `SESSION_SECRET`.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.
6. Owner login: `http://localhost:3000/owner-login.html`.

## Going live
Deploy this Node/Express app to a host with persistent storage. SQLite needs a persistent disk; otherwise use a hosted database. UPI selection is implemented but is not a real payment gateway. Connect a payment provider and verify payments server-side before treating them as paid.
