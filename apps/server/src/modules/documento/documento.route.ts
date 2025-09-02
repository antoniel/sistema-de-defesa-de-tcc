import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import type { AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import { getBancaDocumentInfo, sendCeapgDeclarations } from "./documento.service"

const sendCeapgDeclarationsSchema = z.object({
  ceapgEmail: z.string().email("Email do CEAPG inválido"),
  senderName: z.string().min(1, "Nome do remetente é obrigatório"),
  senderEmail: z.string().email("Email do remetente inválido"),
})

export const documentoRoutes = new Hono<{ Variables: AppVariables }>()
  .get(
    "/info/:bancaId",
    checkRole(["TEACHER", "ADMIN"]),
    zValidator("param", z.object({ bancaId: z.string() })),
    async (c) => {
      const { bancaId } = c.req.valid("param")
      const bancaIdNumber = parseInt(bancaId)

      if (isNaN(bancaIdNumber)) {
        throw new AppError(400, "ID da banca inválido")
      }

      const result = await getBancaDocumentInfo(c, bancaIdNumber)
      return c.json(result)
    }
  )
  .post(
    "/send-ceapg-declarations/:bancaId",
    checkRole(["TEACHER", "ADMIN"]),
    zValidator("param", z.object({ bancaId: z.string() })),
    zValidator("json", sendCeapgDeclarationsSchema),
    async (c) => {
      const { bancaId } = c.req.valid("param")
      const { ceapgEmail, senderName, senderEmail } = c.req.valid("json")
      const bancaIdNumber = parseInt(bancaId)

      if (isNaN(bancaIdNumber)) {
        throw new AppError(400, "ID da banca inválido")
      }

      const result = await sendCeapgDeclarations(c, bancaIdNumber, {
        ceapgEmail,
        senderName,
        senderEmail,
      })

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
          .with({ type: "email_error" }, () => new AppError(500, "Erro ao enviar email"))
          .with({ type: "pdf_generation_error" }, () => new AppError(500, "Erro ao gerar documentos PDF"))
          .exhaustive()
      }

      return c.json({ message: "Declarações enviadas com sucesso para o CEAPG" })
    }
  )
// PDF generation endpoints removed - moved to frontend
// Frontend will use /info/:bancaId to get data and generate PDFs client-side
