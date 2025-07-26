import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { AppError } from "../../error"
import type { AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import { getBancaDocumentInfo } from "./documento.service"

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
// PDF generation endpoints removed - moved to frontend
// Frontend will use /info/:bancaId to get data and generate PDFs client-side
