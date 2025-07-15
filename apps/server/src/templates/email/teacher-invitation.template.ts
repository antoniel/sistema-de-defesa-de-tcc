import { createBaseEmailTemplate } from './base.template'

export interface TeacherInvitationEmailProps {
  nome: string
  invitationUrl: string
}

export const createTeacherInvitationEmail = (props: TeacherInvitationEmailProps): string => {
  const { nome, invitationUrl } = props

  const content = `
    <h2>Olá, ${nome}!</h2>
    <p>Você foi convidado(a) para participar do Sistema Banca como professor(a).</p>
    <p>Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
    <p><strong>Este convite expira em 7 dias.</strong></p>
    <p>Se você não solicitou este convite, pode ignorar este email.</p>
  `

  return createBaseEmailTemplate({
    title: 'Convite para Professor',
    content,
    buttonText: 'Aceitar Convite',
    buttonUrl: invitationUrl,
    variant: 'default'
  })
}