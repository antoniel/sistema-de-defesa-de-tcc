import { emailStyles, escapeHtml } from './base.template'

export interface InvitationInviter {
  nome: string
  email: string
}

export const renderInviterCallout = (inviter: InvitationInviter) => `
  <div style="${emailStyles.callout}">
    <p style="${emailStyles.calloutLabel}">Convidado por</p>
    <p style="${emailStyles.calloutValue}">${escapeHtml(inviter.nome)}</p>
    <p style="margin: 2px 0 0 0; font-size: 14px; line-height: 1.5;"><a href="mailto:${escapeHtml(inviter.email)}" style="${emailStyles.link}">${escapeHtml(inviter.email)}</a></p>
  </div>
`
