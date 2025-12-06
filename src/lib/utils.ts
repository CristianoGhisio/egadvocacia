import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(value: string | undefined | null) {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCNPJ(value: string | undefined | null) {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string | undefined | null) {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export function formatCEP(value: string | undefined | null) {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

export function formatDocument(value: string | undefined | null, type: 'pf' | 'pj') {
  if (!value) return '-'
  if (type === 'pf') return formatCPF(value)
  return formatCNPJ(value)
}

export function formatAddress(params: {
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}) {
  const parts = []

  if (params.street) {
    let streetPart = params.street
    if (params.number) streetPart += `, ${params.number}`
    if (params.complement) streetPart += ` (${params.complement})`
    parts.push(streetPart)
  }

  if (params.neighborhood) parts.push(params.neighborhood)

  if (params.city && params.state) {
    parts.push(`${params.city}/${params.state}`)
  } else {
    if (params.city) parts.push(params.city)
    if (params.state) parts.push(params.state)
  }

  if (params.zipCode) parts.push(`CEP: ${formatCEP(params.zipCode)}`)

  return parts.join(' - ')
}
