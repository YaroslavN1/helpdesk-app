import { Router } from 'express'
import { ticketIdParam } from './ticket-id-param'
import { registerTicketRoutes } from './ticket-routes'
import { registerReplyRoutes } from './reply-routes'
import { registerPolishRoutes } from './polish-routes'

const router = Router()

router.param('id', ticketIdParam)

registerTicketRoutes(router)
registerReplyRoutes(router)
registerPolishRoutes(router)

export default router
