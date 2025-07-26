import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { AppError } from "../../error"
import type { AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import {
  generateAtaDefesa,
  generateDeclaracaoOrientacao,
  generateDeclaracaoParticipacao,
  getBancaDocumentInfo,
} from "./documento.service"

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
    "/gerar/:bancaId",
    checkRole(["TEACHER", "ADMIN"]),
    zValidator("param", z.object({ bancaId: z.string() })),
    async (c) => {
      const { bancaId } = c.req.valid("param")
      const bancaIdNumber = parseInt(bancaId)
      const currentUser = c.get("jwtPayload")

      if (isNaN(bancaIdNumber)) {
        throw new AppError(400, "ID da banca inválido")
      }

      const result = await generateAtaDefesa(c, bancaIdNumber, currentUser.sub)

      return c.body(result.pdf, 200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      })
    }
  )
  .get(
    "/participacao/:bancaId",
    checkRole(["TEACHER", "ADMIN"]),
    zValidator("param", z.object({ bancaId: z.string() })),
    async (c) => {
      const { bancaId } = c.req.valid("param")
      const bancaIdNumber = parseInt(bancaId)
      const currentUser = c.get("jwtPayload")

      if (isNaN(bancaIdNumber)) {
        throw new AppError(400, "ID da banca inválido")
      }

      const result = await generateDeclaracaoParticipacao(c, bancaIdNumber, currentUser.sub)

      return c.body(result.pdf, 200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      })
    }
  )
  .get(
    "/orientacao/:bancaId",
    checkRole(["TEACHER", "ADMIN"]),
    zValidator("param", z.object({ bancaId: z.string() })),
    async (c) => {
      const { bancaId } = c.req.valid("param")
      const bancaIdNumber = parseInt(bancaId)
      const currentUser = c.get("jwtPayload")

      if (isNaN(bancaIdNumber)) {
        throw new AppError(400, "ID da banca inválido")
      }

      const result = await generateDeclaracaoOrientacao(c, bancaIdNumber, currentUser.sub)

      return c.body(result.pdf, 200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      })
    }
  )
