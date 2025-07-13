import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { type AppVariables } from "../../types"
import { checkRole } from "../auth/auth.middleware"
import {
  acceptTeacherInvite,
  createTeacherInvite,
  getAllTeacherInvites,
  validateTeacherInvite,
} from "./teacher-invite.service"
import {
  acceptTeacherInviteSchema,
  createTeacherInviteSchema,
  validateTeacherInviteSchema,
} from "./teacher-invite.schema"

const teacherInviteRouter = new Hono<{ Variables: AppVariables }>()

// Rota para criar convite de professor (apenas admin)
teacherInviteRouter.post(
  "/",
  checkRole(["ADMIN"]),
  zValidator("json", createTeacherInviteSchema.shape.body),
  async (c) => {
    const data = c.req.valid("json")
    const result = await createTeacherInvite(c, data)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "duplicate_email" }, () => new AppError(400, "Email já está em uso"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    // Aqui você pode adicionar o envio de email
    // Por enquanto, retornamos o token para teste
    return c.json({
      message: "Convite criado com sucesso",
      data: {
        id: result.data.id,
        email: result.data.email,
        inviteToken: result.data.inviteToken,
      },
    })
  }
)

// Rota para validar convite (pública)
teacherInviteRouter.get(
  "/validate/:token",
  zValidator("param", validateTeacherInviteSchema.shape.params),
  async (c) => {
    const { token } = c.req.valid("param")
    const result = await validateTeacherInvite(c, token)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invite_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invite_expired" }, () => new AppError(400, "Convite expirado"))
        .with({ type: "invite_already_accepted" }, () => new AppError(400, "Convite já foi aceito"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      message: "Convite válido",
      data: result.data,
    })
  }
)

// Rota para aceitar convite (pública)
teacherInviteRouter.post(
  "/accept",
  zValidator("json", acceptTeacherInviteSchema.shape.body),
  async (c) => {
    const data = c.req.valid("json")
    const result = await acceptTeacherInvite(c, data)

    if (!result.ok) {
      throw match(result.error)
        .with({ type: "invite_not_found" }, () => new AppError(404, "Convite não encontrado"))
        .with({ type: "invite_expired" }, () => new AppError(400, "Convite expirado"))
        .with({ type: "invite_already_accepted" }, () => new AppError(400, "Convite já foi aceito"))
        .with({ type: "duplicate_email" }, () => new AppError(400, "Email já está em uso"))
        .with({ type: "hashing_error" }, () => new AppError(500, "Erro interno do servidor"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
        .exhaustive()
    }

    return c.json({
      message: "Conta criada com sucesso",
      data: {
        id: result.data.id,
        email: result.data.email,
        nome: result.data.nome,
      },
    })
  }
)

// Rota para listar todos os convites (apenas admin)
teacherInviteRouter.get("/", checkRole(["ADMIN"]), async (c) => {
  const result = await getAllTeacherInvites(c)

  if (!result.ok) {
    throw match(result.error)
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .exhaustive()
  }

  return c.json({
    message: "Convites listados com sucesso",
    data: result.data,
  })
})

export { teacherInviteRouter }