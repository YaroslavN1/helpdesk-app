import type { AgentOption } from './ticket'
import type { SenderType } from '../constants/reply'

export type TicketReply = {
  id: number
  body: string
  htmlBody: string | null
  senderType: SenderType
  createdAt: string
  user: AgentOption | null
}
