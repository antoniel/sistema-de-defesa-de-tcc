import { z } from "zod"

export const createFeedbackSchema = z.object({
  taskComplexityRating: z
    .number()
    .int()
    .min(1, { message: "Avaliação deve ser entre 1 e 5." })
    .max(5, { message: "Avaliação deve ser entre 1 e 5." }),
  interfaceConsistencyRating: z
    .number()
    .int()
    .min(1, { message: "Avaliação deve ser entre 1 e 5." })
    .max(5, { message: "Avaliação deve ser entre 1 e 5." }),
  responseTimeRating: z
    .number()
    .int()
    .min(1, { message: "Avaliação deve ser entre 1 e 5." })
    .max(5, { message: "Avaliação deve ser entre 1 e 5." }),
  satisfactionRating: z
    .number()
    .int()
    .min(1, { message: "Avaliação deve ser entre 1 e 5." })
    .max(5, { message: "Avaliação deve ser entre 1 e 5." }),
  usagePurposes: z.array(z.string()).min(1, { message: "Selecione ao menos uma finalidade." }),
  usagePurposeOther: z.string().optional(),
  completedAllTasks: z.boolean({ message: "Campo obrigatório." }),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
