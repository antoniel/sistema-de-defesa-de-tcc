import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { Bancas } from "../../database"

export const paramIdSchema = z.object({
  id: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
    message: "ID must be a number",
  }),
})

const baseBancaSchema = createInsertSchema(Bancas)

export const createBancaSchema = baseBancaSchema.extend({
  autor: z.string().min(1, "Autor é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  dataRealizacao: z.coerce.date(),
})

const partialCreateBancaSchema = createBancaSchema.partial()

export const updateBancaSchema = partialCreateBancaSchema

export type CreateBancaInput = z.infer<typeof createBancaSchema>
export type UpdateBancaInput = z.infer<typeof updateBancaSchema>
export type ParamIdInput = z.infer<typeof paramIdSchema>
