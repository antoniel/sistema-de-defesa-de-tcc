import { createBaseEmailTemplate } from "./base.template"

export interface CalendarInviteEmailProps {
  recipientName?: string
  tituloTrabalho: string
  autor: string
  orientador?: string
  curso?: string
  dataRealizacao: string
  local: string
  periodoAcademico: string
  turma?: string
}

export const createCalendarInviteEmail = (props: CalendarInviteEmailProps): string => {
  const {
    recipientName,
    tituloTrabalho,
    autor,
    orientador,
    curso,
    dataRealizacao,
    local,
    periodoAcademico,
    turma
  } = props

  const greeting = recipientName ? `Olá, ${recipientName}!` : 'Olá!'

  const content = `
    <h2>Convite para Defesa de TCC</h2>
    
    <p>${greeting}</p>
    
    <p>Você está convidado(a) para participar da seguinte defesa de Trabalho de Conclusão de Curso:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1a1a1a; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px;">Detalhes da Defesa</h3>
      
      <p style="margin: 8px 0;"><strong>Título:</strong><br/>${tituloTrabalho}</p>
      
      <p style="margin: 8px 0;"><strong>Autor:</strong> ${autor}</p>
      
      ${orientador ? `<p style="margin: 8px 0;"><strong>Orientador:</strong> ${orientador}</p>` : ''}
      
      ${curso ? `<p style="margin: 8px 0;"><strong>Curso:</strong> ${curso}</p>` : ''}
      
      <p style="margin: 8px 0;"><strong>Data e Hora:</strong> ${dataRealizacao}</p>
      
      <p style="margin: 8px 0;"><strong>Local:</strong> ${local}</p>
      
      <p style="margin: 8px 0;"><strong>Período Acadêmico:</strong> ${periodoAcademico}</p>
      
      ${turma ? `<p style="margin: 8px 0;"><strong>Turma:</strong> ${turma}</p>` : ''}
    </div>
    
    <h3>Como adicionar ao seu calendário</h3>
    
    <p>Este email inclui um arquivo de convite (.ics) em anexo que pode ser usado para adicionar este evento ao seu calendário. O arquivo é compatível com:</p>
    
    <ul style="margin: 16px 0; padding-left: 24px;">
      <li>Google Calendar</li>
      <li>Microsoft Outlook</li>
      <li>Apple Calendar (macOS/iOS)</li>
      <li>Mozilla Thunderbird</li>
      <li>Outros aplicativos de calendário</li>
    </ul>
    
    <p><strong>Para adicionar ao seu calendário:</strong></p>
    <ol style="margin: 16px 0; padding-left: 24px;">
      <li>Baixe o arquivo anexo (.ics)</li>
      <li>Abra o arquivo ou importe-o no seu aplicativo de calendário</li>
      <li>Confirme a adição do evento</li>
    </ol>
    
    <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; border: 1px solid #0ea5e9; margin: 20px 0;">
      <p style="margin: 0; color: #0369a1; font-size: 14px;">
        <strong>💡 Dica:</strong> Na maioria dos sistemas, basta clicar no arquivo anexo para adicionar automaticamente o evento ao seu calendário padrão.
      </p>
    </div>
    
    <p>Agradecemos sua participação e esperamos vê-lo(a) na defesa.</p>
    
    <p style="margin-top: 32px;">
      Atenciosamente,<br/>
      <strong>Sistema de Defesas de TCC do Instituto de Computação - UFBA</strong>
    </p>
  `

  return createBaseEmailTemplate({
    title: 'Convite para Defesa de TCC',
    content: content
  })
}