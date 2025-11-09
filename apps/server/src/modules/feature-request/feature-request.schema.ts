import { z } from "zod"

export const createFeatureRequestSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório." }).max(200, { message: "Título muito longo." }),
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
})

export const voteFeatureRequestSchema = z.object({
  featureRequestId: z.number().int().positive({ message: "ID da solicitação é obrigatório." }),
})

export type CreateFeatureRequestInput = z.infer<typeof createFeatureRequestSchema>
export type VoteFeatureRequestInput = z.infer<typeof voteFeatureRequestSchema>
