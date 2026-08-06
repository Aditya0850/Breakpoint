// Shared verdict → color-class mapping used by Report, Sessions, and People
// pages. "NO HIRE" must be checked before the generic "HIRE" check, since
// "NO HIRE" and "LEANING NO HIRE" both contain the substring "HIRE".
export function verdictStyle(verdict) {
  const v = (verdict || '').toUpperCase()
  if (v.includes('NO HIRE')) return 'bg-mood-cold/10 text-mood-cold border-mood-cold/30'
  if (v.includes('HIRE')) return 'bg-mood-warm/10 text-mood-warm border-mood-warm/30'
  return 'bg-mood-neutral/10 text-mood-neutral border-mood-neutral/30'
}

export function verdictCssColor(verdict) {
  const v = (verdict || '').toUpperCase()
  if (v.includes('NO HIRE')) return 'var(--color-mood-cold)'
  if (v.includes('HIRE')) return 'var(--color-mood-warm)'
  return 'var(--color-mood-neutral)'
}
