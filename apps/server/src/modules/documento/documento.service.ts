import type { Context } from "hono"
import { match } from "ts-pattern"
import { err, ok, type AppResult } from "../../result"
import { AppError } from "../../error"
import { getBancaInfoForDocument } from "../../services/document.service"
import { sendEmail, createCeapgDeclarationsEmail, type EmailAttachment } from "../../services/email.service"
import type { AppVariables } from "../../types"
import { pdf } from "@react-pdf/renderer"

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

interface SendCeapgDeclarationsInput {
  ceapgEmail: string
  senderName: string
  senderEmail: string
}

type SendCeapgDeclarationsError = 
  | { type: "banca_not_found" }
  | { type: "email_error" }
  | { type: "pdf_generation_error" }

export const sendCeapgDeclarations = async (
  c: Context<{ Variables: AppVariables }>, 
  bancaId: number,
  input: SendCeapgDeclarationsInput
): Promise<AppResult<void, SendCeapgDeclarationsError>> => {
  try {
    // Get banca information
    const bancaResult = await getBancaInfoForDocument(c, bancaId)
    if (!bancaResult.ok) {
      return err({ type: "banca_not_found" })
    }

    const bancaInfo = bancaResult.data

    // For now, we'll return a placeholder since PDF generation requires complex setup
    // In a real implementation, this would generate the PDF attachments
    console.log("Sending CEAPG declarations for banca:", bancaId)
    console.log("Banca info:", {
      autor: bancaInfo.autor,
      titulo: bancaInfo.tituloTrabalho,
      membros: bancaInfo.membros.length,
    })

    // Generate email content
    const emailHtml = createCeapgDeclarationsEmail()

    // Send email (without attachments for now)
    const emailResult = await sendEmail({
      to: input.ceapgEmail,
      cc: [input.senderEmail],
      subject: `Declarações para Assinatura - ${bancaInfo.autor}`,
      html: emailHtml,
      from: `"${input.senderName} via SISDEF" <noreply@sistema-banca.com>`,
    })

    if (!emailResult.ok) {
      return err({ type: "email_error" })
    }

    return ok(undefined)
  } catch (error) {
    console.error("Error sending CEAPG declarations:", error)
    return err({ type: "email_error" })
  }
}
