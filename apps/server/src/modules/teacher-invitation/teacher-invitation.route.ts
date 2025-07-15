import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import {
  acceptTeacherInvitationSchema,
  createTeacherInvitationSchema,
  verifyTeacherInvitationSchema,
} from "./teacher-invitation.schema"
import {
  acceptTeacherInvitationService,
  createTeacherInvitationService,
  listTeacherInvitationsService,
  verifyTeacherInvitationService,
} from "./teacher-invitation.service"

const app = new Hono<{ Variables: AppVariables }>()
  .post("/", checkRole(["ADMIN"]), zValidator("json", createTeacherInvitationSchema), async (c) => {
    const body = c.req.valid("json")

    const result = await createTeacherInvitationService(c, body)

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
        message: "Convite enviado com sucesso",
      },
    })
  })
  .get("/verify/:hash", zValidator("param", verifyTeacherInvitationSchema), async (c) => {
    const { hash } = c.req.valid("param")

    const result = await verifyTeacherInvitationService(c, hash)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invitation_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invitation_expired" }, () => new AppError(410, "Convite expirado"))
        .with({ type: "invitation_already_used" }, () => new AppError(410, "Convite já utilizado"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      success: true,
      data: {
        email: result.data.email,
        nome: result.data.nome,
        expiresAt: result.data.expiresAt,
      },
    })
  })
  .post("/accept", zValidator("json", acceptTeacherInvitationSchema), async (c) => {
    const body = c.req.valid("json")

    const result = await acceptTeacherInvitationService(c, body)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invitation_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invitation_expired" }, () => new AppError(410, "Convite expirado"))
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
  .get("/", checkRole(["ADMIN"]), async (c) => {
    const result = await listTeacherInvitationsService(c)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      success: true,
      data: result.data.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        nome: invitation.nome,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      })),
    })
  })

export default app
