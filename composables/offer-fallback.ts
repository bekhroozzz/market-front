import type { Offer } from '~/composables/product'

const STITCH_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDlZkggGSmd33kyLfB11HdITcf8Zf83SZui-bnH5ZmffZN1Xmvgv5DzAy58y8woULCsv4Cu9S_GTSzxo3rDBeYgUkk6q3u8SbG2saqKF7aB8-9QEvM6L9IhmFhJuC-WZS9ApH_ASgwwtBkodjjFqTLywlkSkOeU_BL5x8M0Pkf75M7IvrM8EldCklGHB26zDnWa1AFcW6K9vVCS4edkXelSed-t2AoB9ARw4g9Ui1ZWtzV4tXfrQAEEuQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDc2l-yKudxyYNyuRf9Q7N6JZe5HzvVfdwbDedwccTGY90oQMlly_FFhRHyVdS0sKZ1k-sr4oaWPlpn-zy1Zpag5hw0qAB4rBf5KC3imXXSH_TNJjhH0AQDcBHOnbqLE_DBza7gQgmkWhThytzYgEOhGxFH3OfIOn8oo7mpucIWTkAbSHecKxQs9c9QfxbDTX8hYd5FDJIG7Edg1th9BMlR8Fb37eCKRsG4B90zsZ6tt46uEOy1UghXXQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmaeMj7C1fWSJkwBtj51AX5urHSp7eXnKKw5xkv86ke_TYuEPE1Dpx3UjoBEQr2zfsc2cgz9t-Mp2c7MTNbf7mXXF0ul8mND94FvzNCvqQ5kwbEm1iOO0cmru4hhBilLZGkqHL5wgSku14Nhj69rnCJXSgwA-evvTz7hIsTxiNr1zuXVLZ8VK6UPOO3orub8lCMEKA-7p0pdOBt2wHdhY6sbK7zDEjL-7bA27FQigPS-KoSitoUfYuQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBJxrQ5jv0xHQfgioxPuzUW9_3a-CU9heQOJjmshLteaIsXk4lwytVRVdFCvB5Y-1Eo1CPQQeOSvv6UB946Z9hz5iDv_015V05XeEPSo1a4hl8jXsh0uC9EJJBr5FLExXeWU6AIYIMkY2FctTLsVdDmyKxMr5l4Gjo8dG7B_EC0rimo4oFLNK0HFW6Y5Ag0d6AEN3jQ_PtQuu_WVMvBYLtPYRuyjhJXjmqx6ZbofBIi8ReoGdzrk6y2hw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDeQGzE_Ux3RlmwQZ8yNrsFEPQW2H4FSti0Q8ZDvikMYXjPIukZ7VEiQozV8I7ihluIjik98wvVWX0BMwl34jy0FcefJnRtY4o86eXWxC0S46ZAcU1wlTQBL077gfqRyMeDMCPHWHScQXjCPddo_J7yb4OhzuUEi_WiyBrtaDF2hVlk-eRW9wvvuabwQQ8zJQ4wbBTnqpyMsCP5NemR4SRuFIUJg8a9j7-wZJqW9-zd5CHAxW3hpg4VCA',
]

export function getFallbackOffer(): Offer {
  const week = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    day,
    openTime: '10:00',
    closeTime: '02:00',
    isClosed: false,
  }))

  return {
    id: 'fallback-mega-bowling',
    slug: 'mega-bowling',
    title: 'Mega Bowling Tashkent',
    description:
      'Mega Bowling — один из крупнейших боулинг-клубов Ташкента. Пространство подходит для встреч с друзьями, семейных праздников и корпоративных турниров. 12 дорожек Brunswick Sync, лаунж и кухня на месте.',
    images: STITCH_IMAGES,
    price: 90000,
    oldPrice: 110000,
    prices: [
      { price: 90000, priceType: 'by_hour' },
      { price: 120000, priceType: 'by_hour' },
    ],
    rating: 4.9,
    reviewCount: 142,
    inStock: true,
    branchAddress: 'ул. Амира Темура, 60, Юнусабадский р-н, Ташкент',
    workSchedule: week,
    features: [
      '12 дорожек Brunswick Sync',
      'VIP-зона и лаунж',
      'Кухня и бар',
      'Детские бортики',
      'Сменная обувь',
      'Парковка',
    ],
    rules: [
      'Бесплатная отмена за 2 часа до начала слота',
      'Сменная обувь обязательна',
      'Максимум 6 гостей на одной дорожке',
    ],
    autoConfirmBooking: true,
  }
}
