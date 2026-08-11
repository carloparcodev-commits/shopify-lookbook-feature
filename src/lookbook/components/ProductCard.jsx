import { formatMoney } from '../utils/money';

export default function ProductCard({ product, currency }) {
  if (!product) return null;

  const price = product.priceRange?.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const showCompare =
    compareAt && Number(compareAt.amount) > Number(price?.amount || 0);

  const href = product.onlineStoreUrl || `/products/${product.handle}`;
  const image = product.featuredImage;

  return (
    <article className="lookbook__card">
      <a className="lookbook__card-link" href={href}>
        {image?.url ? (
          <img
            className="lookbook__card-image"
            src={image.url}
            alt={image.altText || product.title}
            loading="lazy"
            width="400"
            height="500"
          />
        ) : (
          <div className="lookbook__card-image lookbook__card-image--placeholder" />
        )}

        <div className="lookbook__card-body">
          <h3 className="lookbook__card-title">{product.title}</h3>
          <div className="lookbook__card-prices">
            <span className="lookbook__price">
              {formatMoney(price?.amount, price?.currencyCode || currency)}
            </span>
            {showCompare ? (
              <s className="lookbook__compare-at">
                {formatMoney(compareAt.amount, compareAt.currencyCode || currency)}
              </s>
            ) : null}
          </div>
        </div>
      </a>
    </article>
  );
}
