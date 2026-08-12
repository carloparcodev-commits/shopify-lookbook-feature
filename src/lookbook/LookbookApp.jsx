import { useEffect, useState } from 'react';
import { fetchProductsByHandles } from './api';
import LookbookGrid from './components/LookbookGrid';

/**
 * Orchestrates lookbook rendering for homepage and product pages.
 *
 * Home mode: render lookbooks passed from Liquid (merchant-selected).
 * Product mode: filter lookbooks that contain the current product, max 2.
 */
export default function LookbookApp({ config }) {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const selected = selectLookbooks(config);
        if (!selected.length) {
          if (!cancelled) {
            setLookbooks([]);
            setLoading(false);
          }
          return;
        }

        const allHandles = unique(
          selected.flatMap((lookbook) => lookbook.productHandles || [])
        );

        const productsByHandle = await fetchProductsByHandles({
          handles: allHandles,
          shopDomain: config.shopDomain,
          storefrontToken: config.storefrontToken,
          country: config.country,
          apiVersion: config.apiVersion,
        });

        const hydrated = selected.map((lookbook) => ({
          ...lookbook,
          products: (lookbook.productHandles || [])
            .map((handle) => productsByHandle[handle])
            .filter(Boolean),
        }));

        if (!cancelled) {
          setLookbooks(hydrated);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load lookbook');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [config]);

  if (loading) {
    return <p className="caption">Loading lookbook…</p>;
  }

  if (error) {
    return <p className="caption">{error}</p>;
  }

  if (!lookbooks.length) {
    return null;
  }

  return (
    <div className="lookbook">
      {lookbooks.map((lookbook) => (
        <LookbookGrid
          key={lookbook.handle || lookbook.title}
          lookbook={lookbook}
          currency={config.currency}
          columnsDesktop={config.columnsDesktop}
          columnsMobile={config.columnsMobile}
          cardStyle={config.cardStyle}
          imageRatio={config.imageRatio}
          cardColorScheme={config.cardColorScheme}
        />
      ))}
    </div>
  );
}

function selectLookbooks(config) {
  const source = Array.isArray(config.lookbooks) ? config.lookbooks : [];

  if (config.mode === 'product') {
    const productHandle = (config.productHandle || '').toLowerCase();
    const matching = source.filter((lookbook) =>
      (lookbook.productHandles || []).some(
        (handle) => String(handle).toLowerCase() === productHandle
      )
    );
    return matching.slice(0, config.maxLookbooks || 2);
  }

  return source;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
