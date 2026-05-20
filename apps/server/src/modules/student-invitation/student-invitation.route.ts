import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import {
  acceptStudentInvitationSchema,
  createStudentInvitationSchema,
  verifyStudentInvitationSchema,
} from "./student-invitation.schema"
import {
  acceptStudentInvitationService,
  createStudentInvitationService,
  listStudentInvitationsService,
  verifyStudentInvitationService,
} from "./student-invitation.service"

const app = new Hono<{ Variables: AppVariables }>()
  .post(
    "/",
    checkRole(["ADMIN", "TEACHER"]),
    zValidator("json", createStudentInvitationSchema),
    async (c) => {
      const body = c.req.valid("json")
      const result = await createStudentInvitationService(c, body)

      if (!result.ok) {
        throw match(result.error)
          .with({ type: "duplicate_email" }, () => new AppError(400, "Email já cadastrado no sistema"))
          .with({ type: "existing_invitation" }, () => new AppError(400, "Já existe um convite pendente para este email"))
          .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
          .with({ type: "email_error" }, () => new AppError(500, "Erro ao enviar email"))
          .exhaustive()
      }

      return c.json({
        success: true,
        data: {
          invitationId: result.data.invitationId,
          userId: result.data.userId,
          message: "Convite enviado com sucesso",
        },
      })
    },
  )
  .get("/verify/:hash", zValidator("param", verifyStudentInvitationSchema), async (c) => {
    const { hash } = c.req.valid("param")
    const result = await verifyStudentInvitationService(c, hash)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invitation_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invitation_already_used" }, () => new AppError(410, "Convite já utilizado"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      success: true,
      data: {
        email: result.data.email,
        nome: result.data.nome,
        matricula: result.data.matricula,
      },
    })
  })
  .post("/accept", zValidator("json", acceptStudentInvitationSchema), async (c) => {
    const body = c.req.valid("json")
    const result = await acceptStudentInvitationService(c, body)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invitation_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invitation_already_used" }, () => new AppError(410, "Convite já utilizado"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro ao processar senha"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      success: true,
      data: {
        userId: result.data.userId,
        message: "Conta criada com sucesso",
      },
    })
  })
  .get("/", checkRole(["ADMIN", "TEACHER"]), async (c) => {
    const result = await listStudentInvitationsService(c)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      success: true,
      data: result.data.map((i) => ({
        id: i.id,
        email: i.email,
        nome: i.nome,
        matricula: i.matricula,
        status: i.status,
        createdAt: i.createdAt,
        userId: i.userId,
      })),
    })
  })

export default app
