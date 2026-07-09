import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DateFormat = 'date' | 'datetime'

export function formatDate(date: string | Date, format: DateFormat = 'date'): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(format === 'datetime' && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  })
}
