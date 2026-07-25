import {
  PRICE_CURRENCY,
  SITE_NAME,
  absoluteAssetUrl,
  absoluteUrl,
  stripHtml,
  truncateMeta,
} from '~/composables/seo'

export interface BreadcrumbItem {
  name: string
  path?: string | null
}

export interface ProductSchemaInput {
  name: string
  description?: string | null
  images?: string[]
  slug?: string | null
  id?: string
  price?: number | null
  oldPrice?: number | null
  currency?: string
  inStock?: boolean | null
  rating?: number | null
  reviewCount?: number | null
  brandName?: string | null
  categoryName?: string | null
}

export function buildOrganizationSchema() {
  const site = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site}#organization`,
    name: SITE_NAME,
    url: site,
    logo: absoluteUrl('/favicon.ico'),
    image: absoluteUrl('/og-default.jpg'),
    description:
      'Платформа для поиска мест отдыха и развлечений: бассейны, рестораны, клубы и другое рядом с вами.',
    areaServed: {
      '@type': 'Country',
      name: 'Uzbekistan',
    },
  }
}

export function buildWebSiteSchema() {
  const site = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site}#website`,
    name: SITE_NAME,
    url: site,
    inLanguage: 'ru-UZ',
    publisher: { '@id': `${site}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  const list = [
    { name: 'Главная', path: '/' },
    ...items.filter(i => i.name),
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      }
      if (item.path)
        entry.item = absoluteUrl(item.path)
      return entry
    }),
  }
}

export function buildProductSchema(input: ProductSchemaInput) {
  const path = input.slug
    ? `/product/${input.slug}`
    : input.id
      ? `/product/${input.id}`
      : undefined

  const images = (input.images?.length ? input.images : ['/og-default.jpg'])
    .filter(Boolean)
    .map(src => absoluteAssetUrl(src))

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: truncateMeta(stripHtml(input.description), 5000) || input.name,
    image: images,
    url: path ? absoluteUrl(path) : undefined,
    category: input.categoryName || undefined,
    brand: input.brandName
      ? { '@type': 'Brand', name: input.brandName }
      : undefined,
  }

  if (input.id)
    schema.sku = input.id

  const price = Number(input.price)
  if (Number.isFinite(price) && price > 0) {
    schema.offers = {
      '@type': 'Offer',
      url: path ? absoluteUrl(path) : undefined,
      priceCurrency: input.currency || PRICE_CURRENCY,
      price: price.toFixed(0),
      availability:
        input.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    }
  }

  const rating = Number(input.rating)
  const reviewCount = Number(input.reviewCount)
  if (Number.isFinite(rating) && rating > 0 && Number.isFinite(reviewCount) && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, rating)).toFixed(1),
      reviewCount: Math.floor(reviewCount),
      bestRating: '5',
      worstRating: '1',
    }
  }

  return schema
}

export function buildCollectionPageSchema(opts: {
  name: string
  description?: string | null
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: truncateMeta(opts.description) || undefined,
    url: absoluteUrl(opts.path),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
  }
}

export function buildLocalBusinessSchema(opts: {
  name: string
  description?: string | null
  path: string
  image?: string | null
  telephone?: string | null
  address?: string | null
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: opts.name,
    description: truncateMeta(opts.description, 500) || undefined,
    url: absoluteUrl(opts.path),
    image: opts.image ? absoluteAssetUrl(opts.image) : absoluteUrl('/og-default.jpg'),
  }

  if (opts.telephone)
    schema.telephone = opts.telephone

  if (opts.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: opts.address,
      addressCountry: 'UZ',
    }
  }

  return schema
}
