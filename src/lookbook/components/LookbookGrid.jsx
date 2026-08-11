import ProductCard from './ProductCard';

export default function LookbookGrid({ lookbook, currency }) {
  if (!lookbook) return null;

  return (
    <section className="lookbook__section">
      {(lookbook.title || lookbook.description) && (
        <header className="lookbook__header">
          {lookbook.title ? <h2 className="lookbook__title">{lookbook.title}</h2> : null}
          {lookbook.description ? (
            <p className="lookbook__description">{lookbook.description}</p>
          ) : null}
        </header>
      )}

      <div className="lookbook__grid">
        {(lookbook.products || []).map((product) => (
          <ProductCard key={product.id || product.handle} product={product} currency={currency} />
        ))}
      </div>
    </section>
  );
}
