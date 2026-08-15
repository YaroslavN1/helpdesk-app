export const SenderType = {
  agent: 'agent',
  customer: 'customer',
} as const

export type SenderType = (typeof SenderType)[keyof typeof SenderType]
export const SENDER_TYPES = Object.values(SenderType) as [SenderType, ...SenderType[]]
export const SENDER_TYPE_LABELS: Record<SenderType, string> = {
  agent: 'Agent',
  customer: 'Customer',
}
