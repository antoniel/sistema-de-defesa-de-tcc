import { createBaseEmailTemplate, emailStyles, escapeHtml } from './base.template'
import { renderInviterCallout, type InvitationInviter } from './inviter'

export interface TeacherInvitationEmailProps {
  nome: string
  invitationUrl: string
  invitedBy?: InvitationInviter
  expiresAt?: Date
}

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Bahia' })

export const createTeacherInvitationEmail = (props: TeacherInvitationEmailProps): string => {
  const { nome, invitationUrl, invitedBy, expiresAt } = props
  const inviterName = invitedBy ? escapeHtml(invitedBy.nome) : undefined

  const intro = inviterName
    ? `<strong>${inviterName}</strong> convidou você para participar do Sistema Banca como professor(a).`
    : 'Você foi convidado(a) para participar do Sistema Banca como professor(a).'

  const expiryText = expiresAt ? `Este convite expira em 7 dias (${formatDate(expiresAt)}).` : 'Este convite expira em 7 dias.'
  const renewText = inviterName ? ` Se ele expirar, peça um novo convite a ${inviterName}.` : ''

  const content = `
    <h2 style="${emailStyles.h2}">Olá, ${escapeHtml(nome)}!</h2>
    <p style="${emailStyles.p}">${intro}</p>
    ${invitedBy ? renderInviterCallout(invitedBy) : ''}
    <p style="${emailStyles.p}">Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
  `

  const afterButton = `
    <p style="${emailStyles.muted}"><strong>${expiryText}</strong>${renewText}</p>
    <p style="${emailStyles.muted}">Se você não esperava este convite, pode ignorar este email.</p>
  `

  return createBaseEmailTemplate({
    title: 'Convite para Professor',
    content,
    afterButton,
    buttonText: 'Aceitar Convite',
    buttonUrl: invitationUrl,
    variant: 'default',
    preheader: inviterName
      ? `${inviterName} convidou você para o Sistema Banca.`
      : 'Você foi convidado(a) para o Sistema Banca.',
  })
}
