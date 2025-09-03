import nodemailer from "nodemailer"
import { env } from "../config/env"
import { err, ok, type AppResult } from "../result"
import { createTeacherInvitationEmail as createTeacherInvitationEmailTemplate, createPasswordResetEmail as createPasswordResetEmailTemplate, createCalendarInviteEmail, type CalendarInviteEmailProps } from "../templates/email"

interface SendEmailInput {
  to: string
  subject: string
  html: string
  attachments?: {
    filename: string
    content: string | Buffer
    contentType: string
  }[]
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
        from: '"Sistema Banca" <noreply@sistema-banca.com>',
        to: input.to,
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
      from: '"Sistema Banca" <noreply@sistema-banca.com>',
      to: input.to,
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

export const sendCalendarInviteEmail = async (
  to: string,
  emailProps: CalendarInviteEmailProps,
  icsContent: string,
  bancaId: number
): Promise<AppResult<void, SendEmailError>> => {
  const subject = `Convite: Defesa de TCC - ${emailProps.tituloTrabalho}`
  const html = createCalendarInviteEmail(emailProps)
  
  const attachments = [{
    filename: `defesa-tcc-banca-${bancaId}.ics`,
    content: icsContent,
    contentType: 'text/calendar; charset=utf-8'
  }]
  
  return sendEmail({
    to,
    subject,
    html,
    attachments
  })
}
