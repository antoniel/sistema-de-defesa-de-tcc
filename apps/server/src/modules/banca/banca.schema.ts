import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { Bancas } from "../../database"

export const paramIdSchema = z.object({
  id: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
    message: "ID must be a number",
  }),
})

const baseBancaSchema = createInsertSchema(Bancas)

const teacherCreateSchema = baseBancaSchema.extend({
  autor: z.string().min(1, "Autor é obrigatório"),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  pronome_autor: z.enum(["0", "1"], { errorMap: () => ({ message: "Gênero do autor inválido" }) }),
})

const studentCreateSchema = baseBancaSchema.extend({
  id_orientador: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
    message: "ID do Orientador deve ser um número",
  }),
})

export const createBancaSchema = z.union([teacherCreateSchema, studentCreateSchema])

const partialTeacherCreateSchema = teacherCreateSchema.partial()
const partialStudentCreateSchema = studentCreateSchema.partial()
export const updateBancaSchema = z.union([partialTeacherCreateSchema, partialStudentCreateSchema])

export type CreateBancaInput = z.infer<typeof createBancaSchema>
export type UpdateBancaInput = z.infer<typeof updateBancaSchema>
export type ParamIdInput = z.infer<typeof paramIdSchema>
