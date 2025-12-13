import { NextResponse } from 'next/server'

type ErrorPayload = {
  error: string
  code?: string
  details?: unknown
}

export function jsonError(status: number, payload: ErrorPayload) {
  return NextResponse.json(payload, { status })
}

