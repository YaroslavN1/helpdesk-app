import { Router } from 'express'
import { ticketIdParam } from './ticket-id-param'
import { registerTicketRoutes } from './ticket-routes'

const router = Router()

router.param('id', ticketIdParam)

registerTicketRoutes(router)

export default router
