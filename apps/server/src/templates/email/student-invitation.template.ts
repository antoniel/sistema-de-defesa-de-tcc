import { createBaseEmailTemplate } from "./base.template"

export interface StudentInvitationEmailProps {
  nome: string
  invitationUrl: string
}

export const createStudentInvitationEmail = (props: StudentInvitationEmailProps): string => {
  const { nome, invitationUrl } = props

  const content = `
    <h2>Olá, ${nome}!</h2>
    <p>Você foi convidado(a) para participar do Sistema Banca como aluno(a).</p>
    <p>Para completar seu cadastro e definir sua senha, clique no botão abaixo:</p>
    <p>Se você não solicitou este convite, pode ignorar este email.</p>
  `

  return createBaseEmailTemplate({
    title: "Convite para Aluno",
    content,
    buttonText: "Completar Cadastro",
    buttonUrl: invitationUrl,
    variant: "default",
  })
}
