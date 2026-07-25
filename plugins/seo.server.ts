import { buildOrganizationSchema, buildWebSiteSchema } from '~/utils/schema'

/**
 * Global JSON-LD for every SSR response (Organization + WebSite + SearchAction).
 */
export default defineNuxtPlugin(() => {
  useJsonLd([buildOrganizationSchema(), buildWebSiteSchema()])
})
