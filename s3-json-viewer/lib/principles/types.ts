export type Principle = Record<string, unknown> & {
  standard_id?: string
  principle_id?: string
}

export type PrinciplesPayload = {
  meta?: Record<string, unknown>
  principles?: Principle[]
}

export function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

export function asArray(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined
}

export function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined
}
