import ProductCard from './ProductCard';

export default function LookbookGrid({
  lookbook,
  currency,
  columnsDesktop = 4,
  columnsMobile = 2,
  cardStyle = 'standard',
  imageRatio = 'adapt',
  cardColorScheme = 'scheme-2',
}) {
  if (!lookbook) return null;

  const desktopCols = Math.min(Math.max(Number(columnsDesktop) || 4, 1), 6);
  const mobileCols = Number(columnsMobile) === 1 ? 1 : 2;

  return (
    <section className="lookbook__section">
      {(lookbook.title || lookbook.description) && (
        <header className="collection__title title-wrapper title-wrapper--no-top-margin">
          {lookbook.title ? (
            <h2 className="related-products__heading inline-richtext h1">{lookbook.title}</h2>
          ) : null}
          {lookbook.description ? (
            <div className="collection__description rte">
              <p>{lookbook.description}</p>
            </div>
          ) : null}
        </header>
      )}

      <ul
        className={`grid product-grid contains-card contains-card--product${
          cardStyle === 'standard' ? ' contains-card--standard' : ''
        } grid--${desktopCols}-col-desktop grid--${mobileCols}-col-tablet-down`}
        role="list"
      >
        {(lookbook.products || []).map((product) => (
          <li key={product.id || product.handle} className="grid__item">
            <ProductCard
              product={product}
              currency={currency}
              cardStyle={cardStyle}
              imageRatio={imageRatio}
              cardColorScheme={cardColorScheme}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
