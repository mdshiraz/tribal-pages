import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(day?: number | null, month?: number | null, year?: number | null): string {
  if (!year) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const parts: string[] = []
  if (month) parts.push(months[month - 1])
  if (day) parts.push(String(day))
  parts.push(String(year))
  return parts.join(' ')
}

export function calcAge(
  birthYear?: number | null, birthMonth?: number | null, birthDay?: number | null,
  deathYear?: number | null, deathMonth?: number | null, _deathDay?: number | null,
  isAlive?: boolean
): number | null {
  if (!birthYear) return null
  const endYear = isAlive ? new Date().getFullYear() : (deathYear ?? new Date().getFullYear())
  const endMonth = isAlive ? new Date().getMonth() + 1 : (deathMonth ?? new Date().getMonth() + 1)
  let age = endYear - birthYear
  if (birthMonth && endMonth < birthMonth) age--
  if (birthDay) { /* fine-grained adjustment could go here */ }
  return age > 0 ? age : null
}

export function getDisplayName(person: { first_name?: string | null, middle_name?: string | null, last_name?: string | null, suffix?: string | null } | null): string {
  if (!person) return 'Unknown'
  return [person.first_name, person.middle_name, person.last_name, person.suffix]
    .filter(Boolean).join(' ') || 'Unknown'
}
