export function formatPrice(value?: number | null, suffix = 'сум'): string {
  if (value == null || Number.isNaN(value)) return ''
  const formatted = new Intl.NumberFormat('ru-RU').format(Math.round(value))
  return `${formatted} ${suffix}`
}

export function formatFromPrice(value?: number | null): string {
  const price = formatPrice(value)
  return price ? `от ${price}` : 'Цена по запросу'
}
