import { createId } from '@paralleldrive/cuid2'

export function generateId(prefix?: string): string {
  const id = createId()
  return prefix ? `${prefix}_${id}` : id
}
