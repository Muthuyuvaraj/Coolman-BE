# Coolman Style Forge

Coolman Style Forge is a streetwear storefront with a MongoDB-backed FastAPI backend and an admin dashboard for managing the catalog, orders, customers, coupons, analytics, settings, notifications, and tracking.

## What Has Been Built

### Storefront

- Premium streetwear storefront with home, shop, offers, wishlist, cart, product details, customize, profile, checkout, and order tracking pages.
- Updated visual system with a warm off-white background, orange primary color, dark typography, cards, badges, responsive layouts, and custom display fonts.
- Product cards support sizes, stock state, prices, discounts, ratings, wishlist actions, and add-to-cart behavior.
- Navbar search button opens a command palette (powered by `cmdk`) that filters products in real time by name, category, and fabric. Each result shows a thumbnail, price, and rating. Selecting a result navigates to the product detail page. The palette can also be opened with `Ctrl+K` / `Cmd+K`.
- Category filtering, price sorting, cart quantity controls, coupon application, delivery calculation, and wishlist support.
- Responsive navigation, footer, mobile layouts, dark/light theme support, animated page sections, and improved loading/error states.


### Customer Accounts and Checkout

- Customers must create an account or sign in before checkout.
- Development accounts are stored in browser `localStorage`.
- Checkout collects phone number and delivery address.
- Orders are saved to MongoDB after checkout.
- Every order receives an order ID and a tracking number such as:

```text
TRK-A1B2C3D4E5
```

- Customer profile displays previous orders, order status, totals, and tracking numbers.
- `/track` searches real MongoDB orders by tracking number.

### Admin Dashboard

The admin dashboard is available at:

```text
http://localhost:8080/admin-dashboard
```

Implemented admin sections:

- Dashboard with live revenue, order, customer, pending-order, and low-stock metrics.
- Products with MongoDB-backed create, edit, delete, search, active/inactive, stock, loading, error, and empty states.
- Product image upload with PNG, JPG, WEBP, and GIF support, preview, and a 2 MB limit.
- Product editor fields for description, original price, badge, sizes, colors, category, fabric, stock, and image.
- Product-card Quick View dialog showing image, price, description, fabric, colors, sizes, and a link to full details.
- Orders with live MongoDB order data, search, status updates, tracking ID editing, and an explicit `Save Changes` button.
- Customers with live customer totals calculated from MongoDB orders.
- Coupons with live create, list, active/inactive, expiry, usage limit, and discount data.
- Payments view based on persisted order payment fields.
- Analytics with live order revenue, order counts, category distribution, daily sales, pending orders, customers, and low stock.
- Settings stored through the backend settings API.
- Real-time notification menu showing recent orders and low-stock products.
- Notification count refreshes every 10 seconds.
- `Clear notifications` dismisses currently visible notifications while allowing future notifications to appear.
- Sidebar collapse and expand controls in both the header and footer.
- Sidebar state persists across page reloads using a browser cookie.
- Collapsed sidebar keeps the `CM` logo visible and correctly sized.
- Theme toggle, admin profile menu, and exit-to-store action.

## Backend API

The FastAPI backend uses MongoDB Atlas through PyMongo.

### Product routes

```text
GET    /api/products
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/{product_id}
DELETE /api/admin/products/{product_id}
```

### Order and tracking routes

```text
POST  /api/orders
GET   /api/orders/customer/{customer_email}
GET   /api/orders/track/{tracking_id}
GET   /api/admin/orders
PATCH /api/admin/orders/{order_id}
```

### Admin routes

```text
GET   /api/admin/customers
POST  /api/customers
GET   /api/admin/coupons
POST  /api/admin/coupons
PATCH /api/admin/coupons/{code}
GET   /api/admin/settings
PUT   /api/admin/settings
GET   /api/admin/analytics
GET   /api/admin/notifications
GET   /api/health
```

## Requirements

- Windows PowerShell
- Node.js and npm
- Python 3.11 recommended
- MongoDB Atlas account and database user
- Atlas Network Access configured for the development machine

## Environment Configuration

Create or update `backend/.env`:

```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?appName=YOUR_APP
MONGODB_DATABASE=coolman
FRONTEND_ORIGIN=http://localhost:8080,http://localhost:5173,http://localhost:5174
```

Do not commit real database credentials. Use a new password if credentials have been exposed in chat, screenshots, logs, or source control.

The backend loads `.env` relative to `backend/app/main.py`, so it works even when Uvicorn is started from the project root.

## Run the Backend

Open PowerShell terminal 1:

```powershell
cd "C:\Users\samue\Documents\coolman-style-forge-main\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

If the virtual environment does not exist:

```powershell
cd "C:\Users\samue\Documents\coolman-style-forge-main\backend"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Verify the backend:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Expected result:

```text
status database
------ --------
ok     connected
```

Keep this terminal open while using the frontend.

## Run the Frontend

Open PowerShell terminal 2 from the project root:

```powershell
cd "C:\Users\samue\Documents\coolman-style-forge-main"
npm install
npx vite --host=0.0.0.0 --port=8080 --strictPort
```

Open:

```text
http://localhost:8080/
```

Admin dashboard:

```text
http://localhost:8080/admin-dashboard
```

Admin products:

```text
http://localhost:8080/admin-dashboard/products
```

Customer profile:

```text
http://localhost:8080/profile
```

Order tracking:

```text
http://localhost:8080/track
```

## If a Port Is Busy

Check port 8080:

```powershell
netstat -ano | findstr :8080
```

Stop the process using the port by replacing `12345` with the real PID:

```powershell
taskkill /PID 12345 /F
```

Then restart Vite with:

```powershell
npx vite --host=0.0.0.0 --port=8080 --strictPort
```

The `--strictPort` option prevents Vite from silently switching to another port.

## Seed the Catalog

To insert the initial catalog into MongoDB:

```powershell
cd "C:\Users\samue\Documents\coolman-style-forge-main\backend"
.\.venv\Scripts\Activate.ps1
python seed.py
```

The seed script uses upsert behavior and does not duplicate products with the same product ID.

## Verification Commands

Frontend build:

```powershell
npm run build
```

Frontend tests:

```powershell
npm test -- --run
```

Frontend lint:

```powershell
npm run lint
```

Backend compilation:

```powershell
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

## Performance Improvements

- Storefront and admin routes are lazy-loaded with React `Suspense`.
- Admin Settings loads without downloading analytics charts first.
- Recharts is split into a separate chunk and loaded only by chart pages.
- Notifications are fetched after the first admin shell paint and then refreshed every 10 seconds.
- Google Fonts use preconnect hints and are loaded from the document head instead of a CSS import chain.
- Product and admin queries use live API data with polling and mutation invalidation.

The Vite development server includes HMR, React Refresh, and unoptimized module requests. For Lighthouse testing, use a production preview:

```powershell
npm run build
npm run preview
```

## Known Production Considerations

- Customer authentication currently uses browser `localStorage`; replace it with server-side authentication before production.
- Product images currently use data URLs in MongoDB; use Cloudinary, S3, Firebase Storage, or another object-storage provider for production.
- Payment status is stored with orders, but Razorpay, Stripe, or another payment provider is not integrated yet.
- Admin authentication and role-based permissions should be added before deployment.
- Real-time updates currently use polling. WebSockets or server-sent events can be added for instant updates.
- The production bundle still contains large chart and UI dependencies; route splitting reduces initial cost, while further dependency optimization can reduce it more.

## Project Structure

```text
src/
  admin/                Admin layout, navigation, pages, and API-backed views
  components/           Storefront and shared UI components
  contexts/             Cart, account, wishlist, and theme state
  data/                 Local product type and category definitions
  hooks/                React hooks
  lib/api.ts            Frontend API client and shared API types
  pages/                Storefront, checkout, profile, and tracking pages
backend/
  app/main.py           FastAPI app, MongoDB collections, and API routes
  seed.py               Initial product catalog seed script
  .env                  Local MongoDB and CORS configuration
```
