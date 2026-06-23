import { pdf } from "@react-pdf/renderer"
import {
  DeclaracaoOrientacaoPDF,
  DeclaracaoParticipacaoPDF,
  FormularioAvaliacaoPDF,
  type DocumentInfo,
} from "@tcc/pdf-components"
import type { Context } from "hono"
import React from "react"
import { match } from "ts-pattern"
import { AppError } from "../../error"
import { err, ok, type AppResult } from "../../result"
import { getBancaInfoForDocument } from "../../services/document.service"
import { createCeagDeclarationsEmail, sendEmail, type EmailAttachment } from "../../services/email.service"
import type { AppVariables } from "../../types"

export const getBancaDocumentInfo = async (c: Context<{ Variables: AppVariables }>, bancaId: number) => {
  const result = await getBancaInfoForDocument(c, bancaId)

  if (!result.ok) {
    throw match(result.error)
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
      .exhaustive()
  }

  return result.data
}

interface SendCeagDeclarationsInput {
  ceapgEmail: string
  senderName: string
  senderEmail: string
  message: string
}

type SendCeagDeclarationsError =
  | { type: "banca_not_found" }
  | { type: "email_error" }
  | { type: "pdf_generation_error" }

export const sendCeagDeclarations = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  input: SendCeagDeclarationsInput
): Promise<AppResult<void, SendCeagDeclarationsError>> => {
  try {
    // Get banca information
    const bancaResult = await getBancaInfoForDocument(c, bancaId)
    if (!bancaResult.ok) {
      return err({ type: "banca_not_found" })
    }

    const bancaInfo = bancaResult.data
    console.log("Generating PDFs for banca:", bancaId)

    // Generate PDF attachments
    const attachments: EmailAttachment[] = []

    try {
      // 1. Formulário de Avaliação
      const formularioComponent = React.createElement(FormularioAvaliacaoPDF, {
        bancaInfo: bancaInfo as unknown as DocumentInfo,
      }) as any
      const formularioStream = await pdf(formularioComponent).toBlob()
      const formularioBuffer = Buffer.from(await formularioStream.arrayBuffer())
      attachments.push({
        filename: "Formulario_Avaliacao.pdf",
        content: formularioBuffer,
        contentType: "application/pdf",
      })

      // 2. Declaração de Orientação (se houver orientador)
      const orientador = bancaInfo.membros.find((m) => m.role === "orientador")
      if (orientador) {
        const orientacaoComponent = React.createElement(DeclaracaoOrientacaoPDF, {
          bancaInfo: bancaInfo as unknown as DocumentInfo,
          orientadorId: orientador.id,
        }) as any
        const orientacaoStream = await pdf(orientacaoComponent).toBlob()
        const orientacaoBuffer = Buffer.from(await orientacaoStream.arrayBuffer())
        attachments.push({
          filename: "Declaracao_Orientacao.pdf",
          content: orientacaoBuffer,
          contentType: "application/pdf",
        })
      }

      // 2b. Declaração de Coorientação (se houver coorientador)
      const coorientador = bancaInfo.membros.find((m) => m.role === "coorientador")
      if (coorientador) {
        const coorientacaoComponent = React.createElement(DeclaracaoOrientacaoPDF, {
          bancaInfo: bancaInfo as unknown as DocumentInfo,
          orientadorId: coorientador.id,
        }) as any
        const coorientacaoStream = await pdf(coorientacaoComponent).toBlob()
        const coorientacaoBuffer = Buffer.from(await coorientacaoStream.arrayBuffer())
        attachments.push({
          filename: "Declaracao_Coorientacao.pdf",
          content: coorientacaoBuffer,
          contentType: "application/pdf",
        })
      }

      // 3. Declarações de Participação (para avaliadores)
      const membrosParticipantes = bancaInfo.membros.filter((m) => m.role === "avaliador")
      for (const membro of membrosParticipantes) {
        const participacaoComponent = React.createElement(DeclaracaoParticipacaoPDF, {
          bancaInfo: bancaInfo as unknown as DocumentInfo,
          membroId: membro.id,
        }) as any
        const participacaoStream = await pdf(participacaoComponent).toBlob()
        const participacaoBuffer = Buffer.from(await participacaoStream.arrayBuffer())
        attachments.push({
          filename: `Declaracao_Participacao_${membro.usuario.nome.replace(/\s+/g, "_")}.pdf`,
          content: participacaoBuffer,
          contentType: "application/pdf",
        })
      }

      console.log(`Generated ${attachments.length} PDF attachments`)
    } catch (pdfError) {
      console.error("Error generating PDFs:", pdfError)
      return err({ type: "pdf_generation_error" })
    }

    // Generate email content from provided message
    const emailHtml = createCeagDeclarationsEmail(input.message)

    // Send email with attachments
    const emailResult = await sendEmail({
      to: input.ceapgEmail,
      cc: [input.senderEmail],
      subject: `Declarações para Assinatura - ${bancaInfo.autor}`,
      html: emailHtml,
      from: `"${input.senderName} via SISDEF" <noreply@sistema-banca.com>`,
      attachments: attachments,
    })

    if (!emailResult.ok) {
      return err({ type: "email_error" })
    }

    console.log("CEAG email sent successfully with attachments")
    return ok(undefined)
  } catch (error) {
    console.error("Error sending CEAG declarations:", error)
    return err({ type: "email_error" })
  }
}
