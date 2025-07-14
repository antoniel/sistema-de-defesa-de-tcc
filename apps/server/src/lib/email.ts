import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions) {
  // Configurar transporter do nodemailer
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  // Configurar opções do email
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  }

  try {
    // Enviar email
    const info = await transporter.sendMail(mailOptions)
    console.log("Email enviado:", info.messageId)
    return info
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw new Error("Falha ao enviar email")
  }
}