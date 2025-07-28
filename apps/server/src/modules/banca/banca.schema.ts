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
  alunoId: z.number().min(1, "Discente é obrigatório"),
  dataRealizacao: z.coerce.date(),
  avaliadores: z.array(z.string()).min(1, "Pelo menos um avaliador é necessário").optional(),
})

const partialCreateBancaSchema = createBancaSchema.partial()

export const updateBancaSchema = z.object({
  tituloTrabalho: z.string().min(1, "Título é obrigatório"),
  palavrasChave: z.string().min(1, "Palavras-chave são obrigatórias"),
  resumo: z.string().min(1, "Resumo é obrigatório"),
  abstract: z.string().min(1, "Abstract é obrigatório"),
  dataRealizacao: z.coerce.date(),
  local: z.string().min(1, "Local é obrigatório"),
  turma: z.string().optional(),
  periodoAcademico: z.string().optional(),
  alunoId: z.number().min(1, "Discente é obrigatório"),
  orientadorId: z.number().min(1, "Orientador é obrigatório"),
  cursoId: z.number().min(1, "Curso é obrigatório"),
  membros: z.array(z.object({ id: z.string().min(1, "Avaliador é obrigatório") })),
})

export const gradeAssignmentSchema = z.object({
  nota: z
    .string()
    .min(1, "Nota é obrigatória")
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 10
      },
      {
        message: "Nota deve ser um número entre 0 e 10",
      }
    ),
})

export type CreateBancaInput = z.infer<typeof createBancaSchema>
export type UpdateBancaInput = z.infer<typeof updateBancaSchema>
export type ParamIdInput = z.infer<typeof paramIdSchema>
export type CreateBanca = z.infer<typeof createBancaSchema>
export type UpdateBanca = z.infer<typeof updateBancaSchema>
