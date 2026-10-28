import { createBaseEmailTemplate, emailStyles, escapeHtml } from "./base.template"
import { renderInviterCallout, type InvitationInviter } from "./inviter"

export interface StudentInvitationEmailProps {
  nome: string
  invitationUrl: string
  invitedBy?: InvitationInviter
}

export const createStudentInvitationEmail = (props: StudentInvitationEmailProps): string => {
  const { nome, invitationUrl, invitedBy } = props
  const inviterName = invitedBy ? escapeHtml(invitedBy.nome) : undefined

  const intro = inviterName
    ? `<strong>${inviterName}</strong> convidou você para participar do Sistema Banca como aluno(a).`
    : "Você foi convidado(a) para participar do Sistema Banca como aluno(a)."

  const content = `
    <h2 style="${emailStyles.h2}">Olá, ${escapeHtml(nome)}!</h2>
    <p style="${emailStyles.p}">${intro}</p>
    ${invitedBy ? renderInviterCallout(invitedBy) : ""}
    <p style="${emailStyles.p}">Para completar seu cadastro e definir sua senha, clique no botão abaixo:</p>
  `

  const afterButton = `
    <p style="${emailStyles.muted}">Se você não esperava este convite, pode ignorar este email.</p>
  `

  return createBaseEmailTemplate({
    title: "Convite para Aluno",
    content,
    afterButton,
    buttonText: "Completar Cadastro",
    buttonUrl: invitationUrl,
    variant: "default",
    preheader: inviterName
      ? `${inviterName} convidou você para o Sistema Banca.`
      : "Você foi convidado(a) para o Sistema Banca.",
  })
}
