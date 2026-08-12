import { createRoot } from 'react-dom/client';
import LookbookApp from './LookbookApp';

/**
 * Mount React lookbooks on any Liquid section that provides a root node.
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
      columnsDesktop: Number(element.dataset.columnsDesktop || 4),
      columnsMobile: Number(element.dataset.columnsMobile || 2),
      cardStyle: element.dataset.cardStyle || 'standard',
      imageRatio: element.dataset.imageRatio || 'adapt',
      cardColorScheme: element.dataset.cardColorScheme || 'scheme-2',
    };

    if (!config.storefrontToken || !config.lookbooks.length) {
      return;
    }

    element.innerHTML = '';
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
