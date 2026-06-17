import { z } from "zod"

export const cursoIdParamSchema = z.object({
  id: z.coerce.number(),
})

export const updateCursoCoordenadorSchema = z.object({
  nomeCoordenador: z.string().min(1, "Nome do coordenador é obrigatório"),
})

export type UpdateCursoCoordenadorInput = z.infer<typeof updateCursoCoordenadorSchema>
