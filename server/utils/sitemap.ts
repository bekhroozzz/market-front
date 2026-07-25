export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function getSiteUrl(): string {
  const config = useRuntimeConfig()
  return String(config.public.siteUrl || 'https://locafun.uz').replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const config = useRuntimeConfig()
  const internal = String(config.apiInternalUrl || '').replace(/\/+$/, '')
  if (internal) return internal
  return String(config.public.BASE_API_URL || '').replace(/\/+$/, '')
}

export function absoluteSiteUrl(path = '/'): string {
  const site = getSiteUrl()
  if (!path || path === '/') return `${site}/`
  if (/^https?:\/\//i.test(path)) return path
  return `${site}${path.startsWith('/') ? path : `/${path}`}`
}

export function renderUrlSet(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const parts = [`    <loc>${escapeXml(url.loc)}</loc>`]
      if (url.lastmod)
        parts.push(`    <lastmod>${escapeXml(url.lastmod)}</lastmod>`)
      if (url.changefreq)
        parts.push(`    <changefreq>${url.changefreq}</changefreq>`)
      if (typeof url.priority === 'number')
        parts.push(`    <priority>${url.priority.toFixed(1)}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

export function renderSitemapIndex(sitemaps: string[]): string {
  const now = new Date().toISOString()
  const body = sitemaps
    .map(loc => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`
}

export function xmlResponse(xml: string) {
  return xml
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  path?: string
  children?: CategoryNode[]
}

export function flattenCategoryPaths(nodes: CategoryNode[], prefix = ''): string[] {
  const paths: string[] = []
  for (const node of nodes || []) {
    const segment = node.slug || node.path?.split('/').pop() || ''
    const path = node.path || (prefix ? `${prefix}/${segment}` : segment)
    if (path)
      paths.push(path.replace(/^\/+|\/+$/g, ''))
    if (node.children?.length)
      paths.push(...flattenCategoryPaths(node.children, path))
  }
  return [...new Set(paths.filter(Boolean))]
}
