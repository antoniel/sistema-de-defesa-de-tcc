import { z } from "zod"

export const cursoIdParamSchema = z.object({
  id: z.coerce.number(),
})

export const createCursoSchema = z.object({
  nome: z.string().min(1, "Nome do curso é obrigatório"),
  sigla: z.string().min(1, "Sigla é obrigatória").max(20, "Sigla muito longa"),
  coordenadorId: z.number().int().positive().nullable().optional(),
})

export const updateCursoSchema = z
  .object({
    nome: z.string().min(1, "Nome do curso é obrigatório").optional(),
    sigla: z.string().min(1, "Sigla é obrigatória").max(20, "Sigla muito longa").optional(),
    coordenadorId: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  })

export type CreateCursoInput = z.infer<typeof createCursoSchema>
export type UpdateCursoInput = z.infer<typeof updateCursoSchema>
