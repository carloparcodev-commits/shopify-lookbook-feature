/**
 * Storefront API helpers for lookbook product hydration.
 * Lookbook metaobjects store product handles only; product data is fetched at runtime.
 *
 * Uses one GraphQL request with aliases (avoids N+1) and skips missing products
 * so a single bad handle does not fail the whole lookbook.
 */

const PRODUCT_SELECTION = `
  id
  handle
  title
  onlineStoreUrl
  featuredImage {
    url
    altText
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
`;

/** Max aliases per request — keeps query size reasonable; chunks use allSettled. */
const CHUNK_SIZE = 25;

/**
 * Fetch products by handle list using Storefront API.
 * One aliased query per chunk; market pricing via @inContext(country:).
 */
export async function fetchProductsByHandles({
  handles,
  shopDomain,
  storefrontToken,
  country,
  apiVersion = '2025-01',
}) {
  const uniqueHandles = [...new Set((handles || []).filter(Boolean))];
  if (!uniqueHandles.length) return {};
  if (!shopDomain || !storefrontToken) {
    throw new Error('Missing shop domain or Storefront API token');
  }

  const endpoint = `https://${shopDomain}/api/${apiVersion}/graphql.json`;
  const chunks = chunkArray(uniqueHandles, CHUNK_SIZE);

  const settled = await Promise.allSettled(
    chunks.map((chunk) =>
      fetchProductChunk({
        handles: chunk,
        endpoint,
        storefrontToken,
        country,
      })
    )
  );

  const productsByHandle = {};
  let firstFatalError = null;

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      Object.assign(productsByHandle, result.value);
    } else if (!firstFatalError) {
      firstFatalError = result.reason;
    }
  }

  if (!Object.keys(productsByHandle).length && firstFatalError) {
    throw firstFatalError instanceof Error
      ? firstFatalError
      : new Error(String(firstFatalError));
  }

  return productsByHandle;
}

async function fetchProductChunk({
  handles,
  endpoint,
  storefrontToken,
  country,
}) {
  const query = buildProductsByHandlesQuery(handles);
  const variables = {
    country: country ? country.toUpperCase() : undefined,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error (${response.status})`);
  }

  const json = await response.json();
  const data = json.data;

  if (!data) {
    const message =
      json.errors?.map((e) => e.message).join(', ') || 'Storefront API returned no data';
    throw new Error(message);
  }

  if (json.errors?.length && typeof console !== 'undefined') {
    console.warn(
      '[lookbook] Storefront API partial errors:',
      json.errors.map((e) => e.message).join(', ')
    );
  }

  const productsByHandle = {};
  handles.forEach((handle, index) => {
    const product = data[`p${index}`];
    if (product) {
      productsByHandle[handle] = product;
    }
  });

  return productsByHandle;
}

/**
 * Build a single query with aliases: p0, p1, p2… for each handle.
 */
function buildProductsByHandlesQuery(handles) {
  const aliasedFields = handles
    .map((handle, index) => {
      const safeHandle = escapeGraphQlString(handle);
      return `p${index}: product(handle: "${safeHandle}") { ${PRODUCT_SELECTION} }`;
    })
    .join('\n');

  return `
    query LookbookProducts($country: CountryCode) @inContext(country: $country) {
      ${aliasedFields}
    }
  `;
}

function escapeGraphQlString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
