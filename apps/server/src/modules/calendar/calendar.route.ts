import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { generateCalendarInvites } from "../../services/calendar.service"
import { sendCalendarInviteEmail } from "../../services/email.service"
import type { AppVariables } from "../../types"
import { getBancaById } from "../banca/banca.service"
import { sendCalendarInviteSchema } from "./calendar.schema"

export const calendarRoutes = new Hono<{ Variables: AppVariables }>()
  .get("/:bancaId/google", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))

    if (!bancaId || isNaN(bancaId)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const bancaResult = await getBancaById(c, bancaId)
    if (!bancaResult.ok) {
      throw match(bancaResult.error)
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno"))
        .exhaustive()
    }

    const { googleUrl } = generateCalendarInvites({ banca: bancaResult.data })

    return c.json({ url: googleUrl })
  })
  .get("/:bancaId/outlook", async (c) => {
    const bancaId = Number(c.req.param("bancaId"))

    if (!bancaId || isNaN(bancaId)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const bancaResult = await getBancaById(c, bancaId)
    if (!bancaResult.ok) {
      throw match(bancaResult.error)
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno"))
        .exhaustive()
    }

    const { outlookUrl } = generateCalendarInvites({ banca: bancaResult.data })

    return c.json({ url: outlookUrl })
  })
  .post("/:bancaId/email", zValidator("json", sendCalendarInviteSchema), async (c) => {
    const bancaId = Number(c.req.param("bancaId"))
    const { email, recipientName } = c.req.valid("json")

    if (!bancaId || isNaN(bancaId)) {
      throw new AppError(400, "ID da banca inválido")
    }

    const bancaResult = await getBancaById(c, bancaId)
    if (!bancaResult.ok) {
      throw match(bancaResult.error)
        .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
        .with({ type: "database_error" }, () => new AppError(500, "Erro interno"))
        .exhaustive()
    }

    const banca = bancaResult.data
    const { ics } = generateCalendarInvites({ banca })

    const dataRealizacao = new Date(banca.dataRealizacao).toLocaleString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bahia",
    })

    const emailProps = {
      recipientName,
      tituloTrabalho: banca.tituloTrabalho,
      autor: banca.autor,
      orientador: banca.membros.find((m) => m.role === "orientador")?.usuario.nome,
      curso: banca.curso?.nome,
      dataRealizacao,
      local: banca.local || "A definir",
      periodoAcademico: banca.periodoAcademico,
      turma: banca.turma,
    }

    const emailResult = await sendCalendarInviteEmail(email, emailProps, ics, bancaId)
    if (!emailResult.ok) {
      throw match(emailResult.error)
        .with({ type: "email_error" }, () => new AppError(500, "Erro ao enviar email"))
        .with({ type: "config_error" }, () => new AppError(500, "Erro de configuração"))
        .exhaustive()
    }

    return c.json({ message: "Convite enviado com sucesso" })
  })
