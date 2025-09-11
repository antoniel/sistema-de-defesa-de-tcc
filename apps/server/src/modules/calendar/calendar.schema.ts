import { z } from "zod"

export const sendCalendarInviteSchema = z.object({
  email: z.string().email("Email inválido"),
  recipientName: z.string().optional()
})

export type SendCalendarInviteRequest = z.infer<typeof sendCalendarInviteSchema>