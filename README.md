# Shopify Lookbook Feature

Technical assessment for Convert — a native Shopify lookbook feature built with
metaobjects, the Storefront API, and React.

## Overview

Fashion brands often want to showcase curated collections of products ("lookbooks")
on their homepage and, contextually, on individual product pages. This project
implements that entirely with Shopify's native platform — no third-party apps.

- **Homepage**: merchants pick a specific lookbook to feature via a section setting.
- **Product pages**: lookbooks are shown automatically for any product that belongs
  to one or more lookbooks — no manual configuration per product, capped at 2 even
  if a product belongs to 3 or more lookbooks.
- **Pricing**: product data (including price and compare-at price) is fetched at
  runtime from the Storefront API, honoring the shopper's active market (AUD/JPY).

## Architecture

```
Metaobject (Lookbook)          Liquid                          React
─────────────────────         ────────                        ───────
title, description       →    sections/lookbook-home.liquid    →  data-lookbook-root
products (handles only)  →    sections/lookbook-product.liquid    (mounted via main.jsx)
                          →    snippets/lookbook.liquid          →  fetches products via
                          →    snippets/lookbook-json-entry.liquid   Storefront API (@inContext)
```

**Why handles only in the metaobject:** the spec requires the lookbook to reference
products by handle, with product data (price, image, title) fetched at runtime
via the Storefront API rather than stored/duplicated in the metaobject. This keeps
pricing and inventory always current and avoids stale cached data in the metaobject.

### Key files

| Path | Purpose |
|---|---|
| `sections/lookbook-home.liquid` | Homepage section — merchant picks a specific Lookbook metaobject via a picker. |
| `sections/lookbook-product.liquid` | Product page section — no picker. Loops all Lookbook metaobjects, finds ones containing the current product, caps at 2. |
| `snippets/lookbook.liquid` | Shared mount shell used by both sections. Renders Dawn-native markup/CSS and the `data-lookbook-root` mount point consumed by React. Dedupes the bundle `<script>` load via a `window` flag so it only loads once even if both sections are on the same page. |
| `snippets/lookbook-json-entry.liquid` | Serializes one Lookbook metaobject entry (title, description, product handles) to JSON, reused by both sections. |
| `config/settings_schema.json` | Adds a "Lookbook" theme settings group with the Storefront API public access token. |
| `src/lookbook/` | React source (see below), compiled by esbuild into `assets/lookbook.js`. |

### React app (`src/lookbook/`)

| File | Responsibility |
|---|---|
| `main.jsx` | Finds all `[data-lookbook-root]` elements, reads their `data-*` config, mounts a `LookbookApp` per element. Re-mounts on `shopify:section:load` for theme editor live preview. |
| `LookbookApp.jsx` | Orchestrator. In `home` mode, renders the merchant-selected lookbook as-is. In `product` mode, filters the full lookbook list down to ones containing the current product handle, capped to `maxLookbooks` (2). Fetches product data for all needed handles in one pass. |
| `api.js` | Storefront API client. Builds **one aliased GraphQL query** (`p0: product(handle: "...")`, `p1: ...`) per batch of handles instead of one request per product, avoiding an N+1 request pattern. Chunks batches at 25 handles to keep query size reasonable. Uses `@inContext(country: $country)` so price/compareAtPrice come back in the shopper's active market. Uses `Promise.allSettled` so one bad handle or one failed chunk doesn't take down the whole lookbook. |
| `utils/money.js` | Formats Storefront API money values using `Intl.NumberFormat`, keyed off the `currencyCode` returned by the API (falls back to the Liquid-provided currency only if the API response is missing one). |
| `components/LookbookGrid.jsx` | Renders one lookbook's heading/description + product grid using Dawn's native `grid`/`product-grid` classes. |
| `components/ProductCard.jsx` | Renders one product card using Dawn's card/price markup conventions. Shows a struck-through compare-at price only when it's actually higher than the current price. |

## Setup

### 1. Metaobject definition

Create a metaobject definition (Content → Metaobjects) named **Lookbook**:

| Field | Type | Notes |
|---|---|---|
| Title | Single line text | Required |
| Description | Multi-line text | Optional |
| Products | Product (list) | The lookbook's products — only the handle is used at runtime |

Enable **Storefront API access** on the definition so entries can be queried by the
theme's `metaobjects.lookbook.values` (used on the product page section) and
selected via the section picker (used on the homepage section).

### 2. Storefront API access token

Products are fetched client-side, so a **public** Storefront API access token is
required (never the Admin API token).

1. Install the **Headless** channel from the Shopify App Store.
2. Create a storefront (Settings → your storefront → Storefront API → Manage).
3. Copy the **Public access token**.
4. In the Shopify theme editor, go to **Theme settings → Lookbook** and paste the
   token into **Storefront API access token**.

> Note: an early iteration of this project used a Dev Dashboard custom app to
> generate this token. As of Jan 2026, legacy custom app creation is deprecated
> for regular merchant stores in favor of Dev Dashboard apps; a Headless channel
> storefront was used instead as the more current, minimal-setup approach for a
> public Storefront API token.

### 3. Markets & pricing

Configure Markets (Settings → Markets) for each currency you want to support
(this project targets **Australia (AUD)** and **Japan (JPY)**). Market-specific
price/compare-at price overrides are set per product in each market's **Catalog**
(Markets → [market] → Catalogs), rather than relying purely on automatic currency
conversion — this demonstrates the override behavior explicitly rather than just
FX conversion.

### 4. Build the React bundle

```bash
npm install
npm run build      # one-off production build → assets/lookbook.js
npm run watch       # rebuilds on file change, for local development
```

### 5. Add the sections

In the theme editor:
- **Homepage**: Add section → Lookbook → pick a lookbook from the metaobject picker.
- **Product template**: Add section → Lookbook (product) → no configuration needed;
  it automatically shows any lookbooks containing the product being viewed.

## Technical decisions & assumptions

- **Priority when a product is in 3+ lookbooks**: the product page section shows
  the first 2 matching lookbooks in whatever order Shopify returns from
  `metaobjects.lookbook.values`. The brief doesn't specify a tie-break rule, so
  no explicit ordering/priority logic was added — the section simply takes the
  first 2 matches and stops (see the `matched_count >= max_lookbooks` break in
  `lookbook-product.liquid`). If a specific priority (e.g. most recently
  updated, a merchant-set priority field, or featured flag) is needed, that
  would require adding an explicit sort field to the Lookbook metaobject.
- **Single aliased GraphQL query over N+1 requests**: fetching each product
  individually would mean one HTTP round-trip per product per lookbook render.
  Aliasing multiple `product(handle:)` lookups into one query reduces this to one
  request per batch (chunked at 25 to keep query size reasonable).
- **Global theme setting for the Storefront token** (rather than a per-section
  setting): the token is the same regardless of which page/section is rendering,
  so storing it once in Theme settings avoids re-entering it per section instance.
- **Dawn-native styling**: the lookbook UI reuses Dawn's existing
  `component-card.css`, `component-price.css`, and grid/card class conventions
  rather than introducing custom CSS, so it looks and behaves consistently with
  the rest of the theme (spacing, color schemes, responsive columns).
- **Currency resolution**: display currency is taken from the Storefront API
  response's `currencyCode` on each price object (which reflects the market
  passed via `@inContext`), not from a value passed down from Liquid. The
  Liquid-provided `data-currency` is only a fallback for the rare case the API
  response is missing a currency code.

## Known limitations

- Product data is fetched client-side on every page load; there's no caching
  layer, so repeat visits re-fetch from the Storefront API each time.
- The lookbook shown when a product belongs to 3+ lookbooks depends on platform
  return order rather than an explicit priority field (see "Technical decisions
  & assumptions" above).