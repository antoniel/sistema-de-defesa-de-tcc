import nodemailer from "nodemailer"
import { env } from "../config/env"
import { err, ok, type AppResult } from "../result"
import {
  createCalendarInviteEmail,
  createPasswordResetEmail as createPasswordResetEmailTemplate,
  createTeacherInvitationEmail as createTeacherInvitationEmailTemplate,
  type CalendarInviteEmailProps,
} from "../templates/email"

export type EmailAttachment = {
  filename: string
  content: string | Buffer
  contentType: string
}

interface SendEmailInput {
  to: string
  subject: string
  html: string
  cc?: string[]
  from?: string
  attachments?: EmailAttachment[]
}

type SendEmailError = { type: "email_error" } | { type: "config_error" }

export const sendEmail = async (input: SendEmailInput): Promise<AppResult<void, SendEmailError>> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    })

    if (env.NODE_ENV === "development") {
      console.log("No SMTP config found. Using test account for development.")
      const testAccount = await nodemailer.createTestAccount()

      const devTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })

      const info = await devTransporter.sendMail({
        from: input.from || '"Sistema Banca" <noreply@sistema-banca.com>',
        to: input.to,
        cc: input.cc,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      })

      console.log("Message sent: %s", info.messageId)
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

      return ok(undefined)
    }

    // Production email sending
    const info = await transporter.sendMail({
      from: input.from || '"Sistema Banca" <noreply@sistema-banca.com>',
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
    })

    console.log("Email sent: %s", info.messageId)
    return ok(undefined)
  } catch (error) {
    console.error("Email sending failed:", error)
    return err({ type: "email_error" })
  }
}

export const createTeacherInvitationEmail = (nome: string, invitationUrl: string): string => {
  return createTeacherInvitationEmailTemplate({ nome, invitationUrl })
}

export const createPasswordResetEmail = (nome: string, resetUrl: string): string => {
  return createPasswordResetEmailTemplate({ nome, resetUrl })
}

// Basic HTML escaping to avoid injection in email body
const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")

// Convert plain text with newlines into HTML paragraphs
const textToParagraphsHtml = (text: string) => {
  const escaped = escapeHtml(text)
  const paragraphs = escaped
    .split(/\n\s*\n/) // blank line separates paragraphs
    .map((p) => `<p style="margin-bottom: 20px;">${p.replace(/\n/g, "<br>")}</p>`) // keep line breaks
    .join("\n")
  return paragraphs
}

export const createCeagDeclarationsEmail = (plainTextMessage: string): string => {
  const bodyHtml = textToParagraphsHtml(plainTextMessage)
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #2563eb; margin: 0;">SISDEF - Sistema de Defesas</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Universidade Federal da Bahia</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          ${bodyHtml}
        </div>
      </div>
    </div>
  `
}
export const sendCalendarInviteEmail = async (
  to: string,
  emailProps: CalendarInviteEmailProps,
  icsContent: string,
  bancaId: number
): Promise<AppResult<void, SendEmailError>> => {
  const subject = `Convite: Defesa de TCC - ${emailProps.tituloTrabalho}`
  const html = createCalendarInviteEmail(emailProps)

  const attachments = [
    {
      filename: `defesa-tcc-banca-${bancaId}.ics`,
      content: icsContent,
      contentType: "text/calendar; charset=utf-8",
    },
  ]

  return sendEmail({
    to,
    subject,
    html,
    attachments,
  })
}
