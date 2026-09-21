# Change Log

## 2026-09-21

### Search command palette

- Fixed the navbar search button which previously had no click handler and did nothing.
- The search button now opens a `cmdk`-powered command palette dialog that lists all products.
- Products are filtered in real time by name, category, and fabric as the user types.
- Each search result shows a product thumbnail, name, category, fabric, price, and rating.
- Selecting a result navigates to the product detail page and closes the dialog.
- Added `Ctrl+K` / `Cmd+K` keyboard shortcut to open and close the search palette from anywhere.

## 2026-09-18


### MongoDB Atlas product sync

- Added a FastAPI Python backend under `backend/` with MongoDB Atlas configuration through environment variables.
- Added product health, customer-read, admin-read, create, update, and delete API endpoints.
- Added an Atlas seed script for the existing product catalog.
- Connected customer product grids to the API through React Query with bundled product fallback when the backend is unavailable.
- Connected admin product create, edit, active/inactive, and delete actions to MongoDB and invalidated customer caches after changes.
- Added backend setup documentation and ignored local Atlas credentials and Python virtual environments.

### Storefront UI refresh

- Refined the global color system with warmer surfaces, stronger contrast, improved shadows, and updated light/dark theme tokens.
- Added subtle background atmosphere and reusable section-heading styling.
- Redesigned the navbar with a branded circular mark, pill navigation, clearer active states, and improved mobile styling.
- Refined the hero section with stronger typography, updated overlays, clearer calls to action, and storefront statistics.
- Updated the feature strip with bordered service tiles and hover movement.
- Improved product section headings with curated-picks labels and more consistent spacing.
- Refined category tiles with updated backgrounds, borders, rounded corners, and hover elevation.
- Redesigned the newsletter section with an insider-access label, framed content area, and responsive subscription form.
- Moved the Google Fonts import before Tailwind directives to remove the CSS build warning.

### Wishlist feature

- Added `WishlistContext` to manage saved products across the application.
- Persisted wishlist items in browser `localStorage` under `coolman-wishlist`.
- Connected product-card heart buttons to add and remove products from the wishlist.
- Added the `/wishlist` route and a dedicated wishlist page.
- Added an empty wishlist state with a link back to the shop.
- Added a saved-product grid that reuses the existing product cards.

### Additional routing

- Added the `/profile` route and a simple profile placeholder page because the navbar already exposed a profile link.
- Kept the existing cart, shop, product, offers, customization, tracking, and admin routes unchanged.

### Validation

- `npm run build` passes successfully.
- `npm test -- --run` passes successfully.
- Editor diagnostics report no errors in the files changed for the wishlist feature.
- Full lint still reports existing issues in shared UI components, `ShopPage.tsx`, and `tailwind.config.ts`.
