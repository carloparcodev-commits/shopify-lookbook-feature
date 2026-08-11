import { createRoot } from 'react-dom/client';
import LookbookApp from './LookbookApp';

/**
 * Mount React lookbooks on any Liquid section that provides a root node.
 * Expected data attributes on the mount element:
 * - data-mode: "home" | "product"
 * - data-lookbooks: JSON array of lookbook payloads (title, description, productHandles)
 * - data-product-handle: current product handle (product page)
 * - data-storefront-token: Storefront API public token
 * - data-shop-domain: shop domain (e.g. example.myshopify.com)
 * - data-currency: ISO currency code from the active market
 * - data-country: ISO country code from localization
 * - data-api-version: Storefront API version (optional)
 * - data-max-lookbooks: max lookbooks on product page (default 2)
 */
function mountLookbooks() {
  const roots = document.querySelectorAll('[data-lookbook-root]');

  roots.forEach((element) => {
    if (element.dataset.mounted === 'true') return;

    const config = {
      mode: element.dataset.mode || 'home',
      lookbooks: parseJson(element.dataset.lookbooks, []),
      productHandle: element.dataset.productHandle || '',
      storefrontToken: element.dataset.storefrontToken || '',
      shopDomain: element.dataset.shopDomain || window.Shopify?.shop || '',
      currency: element.dataset.currency || '',
      country: element.dataset.country || '',
      apiVersion: element.dataset.apiVersion || '2025-01',
      maxLookbooks: Number(element.dataset.maxLookbooks || 2),
    };

    const root = createRoot(element);
    root.render(<LookbookApp config={config} />);
    element.dataset.mounted = 'true';
  });
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLookbooks);
} else {
  mountLookbooks();
}

document.addEventListener('shopify:section:load', mountLookbooks);
