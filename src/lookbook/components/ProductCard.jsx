import { formatMoney } from '../utils/money';

export default function ProductCard({
  product,
  currency,
  cardStyle = 'standard',
  imageRatio = 'adapt',
  cardColorScheme = 'scheme-2',
}) {
  if (!product) return null;

  const price = product.priceRange?.minVariantPrice;
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const showCompare =
    compareAt && Number(compareAt.amount) > Number(price?.amount || 0);

  const href = product.onlineStoreUrl || `/products/${product.handle}`;
  const image = product.featuredImage;
  const ratioPercent = ratioPercentFor(imageRatio, image);
  const priceAmount = formatMoney(price?.amount, price?.currencyCode || currency);
  const compareAmount = showCompare
    ? formatMoney(compareAt.amount, compareAt.currencyCode || currency)
    : '';

  return (
    <div className="card-wrapper product-card-wrapper underline-links-hover">
      <div
        className={[
          'card',
          `card--${cardStyle}`,
          image ? 'card--media' : 'card--text',
          cardStyle === 'card' ? `color-${cardColorScheme} gradient` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--ratio-percent': `${ratioPercent}%` }}
      >
        <div
          className={[
            'card__inner',
            cardStyle === 'standard' ? `color-${cardColorScheme} gradient` : '',
            image || cardStyle === 'standard' ? 'ratio' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ '--ratio-percent': `${ratioPercent}%` }}
        >
          {image?.url ? (
            <div className="card__media">
              <div className="media media--transparent media--hover-effect">
                <img
                  src={image.url}
                  alt={image.altText || product.title}
                  className="motion-reduce"
                  loading="lazy"
                  width="533"
                  height="533"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="card__content">
          <div className="card__information">
            <h3 className={`card__heading${image || cardStyle === 'standard' ? ' h5' : ''}`}>
              <a href={href} className="full-unstyled-link">
                {product.title}
              </a>
            </h3>
            <div className="card-information">
              <div
                className={`price${showCompare ? ' price--on-sale' : ''}`}
              >
                <div className="price__container">
                  {showCompare ? (
                    <div className="price__sale">
                      <span className="visually-hidden visually-hidden--inline">
                        Regular price
                      </span>
                      <span>
                        <s className="price-item price-item--regular">{compareAmount}</s>
                      </span>
                      <span className="visually-hidden visually-hidden--inline">
                        Sale price
                      </span>
                      <span className="price-item price-item--sale price-item--last">
                        {priceAmount}
                      </span>
                    </div>
                  ) : (
                    <div className="price__regular">
                      <span className="visually-hidden visually-hidden--inline">
                        Regular price
                      </span>
                      <span className="price-item price-item--regular">{priceAmount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ratioPercentFor(imageRatio, image) {
  if (imageRatio === 'portrait') return 125;
  if (imageRatio === 'square') return 100;

  const width = Number(image?.width);
  const height = Number(image?.height);
  if (width > 0 && height > 0) {
    return (1 / (width / height)) * 100;
  }
  return 100;
}
