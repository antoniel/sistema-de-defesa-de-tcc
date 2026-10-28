import { createBaseEmailTemplate, emailStyles, escapeHtml } from './base.template'

export interface PasswordResetEmailProps {
  nome: string
  resetUrl: string
}

export const createPasswordResetEmail = (props: PasswordResetEmailProps): string => {
  const { nome, resetUrl } = props

  const content = `
    <h2 style="${emailStyles.h2}">Olá, ${escapeHtml(nome)}!</h2>
    <p style="${emailStyles.p}">Você solicitou a recuperação de senha para sua conta no Sistema Banca.</p>
    <p style="${emailStyles.p}">Para redefinir sua senha, clique no botão abaixo:</p>

    <div style="${emailStyles.warning}">
      <strong>⚠️ Importante:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        <li>Este link expira em 1 hora</li>
        <li>Só pode ser usado uma vez</li>
        <li>Se você não solicitou esta recuperação, ignore este email</li>
      </ul>
    </div>
  `

  return createBaseEmailTemplate({
    title: 'Recuperação de Senha',
    content,
    buttonText: 'Redefinir Senha',
    buttonUrl: resetUrl,
    variant: 'default',
    preheader: 'Redefina sua senha do Sistema Banca. O link expira em 1 hora.',
  })
}
