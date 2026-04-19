import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  format,
  formatDistanceToNow,
  startOfWeek,
  addDays,
  isBefore,
  startOfDay,
  addWeeks,
  isWithinInterval,
  endOfWeek,
} from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'MMM d')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  if (!dueDate) return false
  return isBefore(new Date(dueDate), startOfDay(new Date()))
}

export function getNextMeetingDate(): Date {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const tuesday = addDays(weekStart, 1)
  if (isBefore(now, tuesday)) return tuesday
  return addDays(tuesday, 7)
}

export function getCurrentWeekMeetingDate(): Date {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  return addDays(weekStart, 1)
}

export function isDueThisWeek(dueDate: string | Date): boolean {
  const now = new Date()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const date = new Date(dueDate)
  return isWithinInterval(date, { start: startOfDay(now), end: weekEnd })
}

export function isDueNextWeek(dueDate: string | Date): boolean {
  const now = new Date()
  const nextWeekStart = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1)
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 })
  const date = new Date(dueDate)
  return isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })
}
