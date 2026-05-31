export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'

export type PaymentMethod = 'cash' | 'card'
export type CancelledBy = 'customer' | 'seller'

export interface BookingOffer {
  id: string
  title: string
  images?: string[]
  slug?: string
  branchAddress?: string
  workSchedule?: {
    day: number
    openTime: string | null
    closeTime: string | null
    isClosed: boolean
  }[]
}

export interface BookingCustomer {
  id: number
  email: string
}

export interface Booking {
  id: string
  offerId: string
  sellerId: number
  customerId: number
  date: string
  time: string
  personsCount: number
  phone: string
  comment: string | null
  paymentMethod: PaymentMethod
  status: BookingStatus
  secretCode: string | null
  confirmedAt: string | null
  activatedAt: string | null
  cancelledAt: string | null
  cancelledBy: CancelledBy | null
  cancelReason: string | null
  offer: BookingOffer
  customer: BookingCustomer
  createdAt: string
  updatedAt: string
}

export interface CreateBookingPayload {
  offerId: string
  date: string
  time: string
  personsCount: number
  phone: string
  comment?: string
  paymentMethod: PaymentMethod
}

export function useBooking() {
  const { $api } = useNuxtApp()

  async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return $api<Booking>('/api/bookings', { method: 'POST', body: payload })
  }

  async function getMyBookings(filter?: 'active' | 'history'): Promise<Booking[]> {
    return $api<Booking[]>('/api/bookings/my', {
      method: 'GET',
      query: filter ? { filter } : {},
    })
  }

  async function getBookingById(id: string): Promise<Booking> {
    return $api<Booking>(`/api/bookings/${id}`, { method: 'GET' })
  }

  async function cancelBooking(id: string, reason?: string): Promise<Booking> {
    return $api<Booking>(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: { reason },
    })
  }

  return {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
  }
}

/** Map offer workSchedule day (0=Mon…6=Sun) to JS Date.getDay() (0=Sun…6=Sat) */
export function offerDayToJsDay(offerDay: number): number {
  return (offerDay + 1) % 7
}

/** Get array of JS week day numbers (0=Sun…6=Sat) that are closed */
export function getClosedWeekDays(
  workSchedule: { day: number; isClosed: boolean }[] | undefined,
): number[] {
  if (!workSchedule?.length) return []
  return workSchedule
    .filter((s) => s.isClosed)
    .map((s) => offerDayToJsDay(s.day))
}

/** Get schedule entry for a given Date */
export function getScheduleForDate(
  workSchedule: { day: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[] | undefined,
  date: Date,
): { openTime: string | null; closeTime: string | null; isClosed: boolean } | null {
  if (!workSchedule?.length) return null
  const jsDay = date.getDay()
  // Convert JS day to offer day: Sun(0)→6, Mon(1)→0, ...
  const offerDay = jsDay === 0 ? 6 : jsDay - 1
  return workSchedule.find((s) => s.day === offerDay) ?? null
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждена',
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена',
  expired: 'Просрочена',
}

export const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  active: 'badge-success',
  completed: 'badge-neutral',
  cancelled: 'badge-error',
  expired: 'badge-ghost',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Наличные',
  card: 'Банковская карта',
}
