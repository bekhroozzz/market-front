import { getScheduleForDate } from '~/composables/booking'
import type { WorkScheduleDay } from '~/composables/product'

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export function dayName(day: number): string {
  return DAY_NAMES[day] ?? ''
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60) % 24
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function generateTimeSlots(
  schedule: WorkScheduleDay[] | undefined,
  date: Date,
  step = 60,
): string[] {
  const entry = getScheduleForDate(schedule, date)
  if (entry?.isClosed) return []

  const open = entry?.openTime || '10:00'
  const close = entry?.closeTime || '23:00'
  let start = toMinutes(open)
  let end = toMinutes(close)
  if (end <= start) end += 24 * 60

  const slots: string[] = []
  for (let cursor = start; cursor + step <= end; cursor += step)
    slots.push(fromMinutes(cursor % (24 * 60)))

  if (!slots.length) return ['16:00', '17:00', '18:00', '20:00', '21:00']

  const isToday = date.toDateString() === new Date().toDateString()
  if (!isToday) return slots

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30
  return slots.filter(slot => toMinutes(slot) >= nowMinutes)
}

export function isVenueOpenNow(schedule?: WorkScheduleDay[]): boolean {
  if (!schedule?.length) return true
  const today = getScheduleForDate(schedule, new Date())
  if (!today || today.isClosed || !today.openTime || !today.closeTime) return false
  const now = new Date().getHours() * 60 + new Date().getMinutes()
  const open = toMinutes(today.openTime)
  let close = toMinutes(today.closeTime)
  if (close <= open) close += 24 * 60
  const current = now < open ? now + 24 * 60 : now
  return current >= open && current < close
}

export function todayCloseLabel(schedule?: WorkScheduleDay[]): string | null {
  const today = getScheduleForDate(schedule, new Date())
  return today?.closeTime || null
}

export function formatDayChip(date: Date): { label: string; day: string } {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' })
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  if (date.toDateString() === today.toDateString()) return { label: 'Сегодня', day }
  if (date.toDateString() === tomorrow.toDateString()) return { label: 'Завтра', day }
  return { label: weekday, day }
}

export function formatBookingChip(date: Date): { weekday: string; day: number; month: string } {
  return {
    weekday: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('ru-RU', { month: 'short' }),
  }
}

export function addMinutesToTime(value: string, minutes = 60): string {
  return fromMinutes((toMinutes(value) + minutes) % (24 * 60))
}
