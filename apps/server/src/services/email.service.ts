import nodemailer from "nodemailer"
import { env } from "../config/env"
import { err, ok, type AppResult } from "../result"

interface SendEmailInput {
  to: string
  subject: string
  html: string
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

    if (env.NODE_ENV !== "production") {
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
    })

    console.log("Email sent: %s", info.messageId)
    return ok(undefined)
  } catch (error) {
    console.error("Email sending failed:", error)
    return err({ type: "email_error" })
  }
}

export const createTeacherInvitationEmail = (nome: string, invitationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Convite para Professor - Sistema Banca</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sistema Banca</h1>
        <p>Convite para Professor</p>
      </div>
      <div class="content">
        <h2>Olá, ${nome}!</h2>
        <p>Você foi convidado(a) para participar do Sistema Banca como professor(a).</p>
        <p>Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
        <p style="text-align: center;">
          <a href="${invitationUrl}" class="button">Aceitar Convite</a>
        </p>
        <p>Este convite expira em 7 dias.</p>
        <p>Se você não solicitou este convite, pode ignorar este email.</p>
      </div>
      <div class="footer">
        <p>Sistema Banca - Gerenciamento de Bancas de TCC</p>
      </div>
    </body>
    </html>
  `
}

export const createPasswordResetEmail = (nome: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recuperação de Senha - Sistema Banca</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sistema Banca</h1>
        <p>Recuperação de Senha</p>
      </div>
      <div class="content">
        <h2>Olá, ${nome}!</h2>
        <p>Você solicitou a recuperação de senha para sua conta no Sistema Banca.</p>
        <p>Para redefinir sua senha, clique no botão abaixo:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Redefinir Senha</a>
        </p>
        <div class="warning">
          <strong>⚠️ Importante:</strong>
          <ul>
            <li>Este link expira em 1 hora</li>
            <li>Só pode ser usado uma vez</li>
            <li>Se você não solicitou esta recuperação, ignore este email</li>
          </ul>
        </div>
        <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-size: 14px;">
          ${resetUrl}
        </p>
      </div>
      <div class="footer">
        <p>Sistema Banca - Gerenciamento de Bancas de TCC</p>
      </div>
    </body>
    </html>
  `
}
