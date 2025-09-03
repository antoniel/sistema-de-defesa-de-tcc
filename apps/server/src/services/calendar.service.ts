import { type SelectBanca, type SelectUser } from "../database/schema"

interface BancaCalendarData {
  banca: SelectBanca & {
    orientador?: SelectUser
    curso?: { nome: string }
  }
}

/**
 * Generate ICS (iCalendar) file content for a banca defense
 */
export const generateICSContent = (data: BancaCalendarData): string => {
  const { banca } = data
  
  // Calculate end time (2 hours after start)
  const startDate = new Date(banca.dataRealizacao)
  const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // Add 2 hours

  // Format dates for ICS (YYYYMMDDTHHMMSSZ format in UTC)
  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const startFormatted = formatDateForICS(startDate)
  const endFormatted = formatDateForICS(endDate)

  // Create event description
  const description = [
    `Autor: ${banca.autor}`,
    banca.orientador ? `Orientador: ${banca.orientador.nome}` : '',
    banca.curso ? `Curso: ${banca.curso.nome}` : '',
    `Período: ${banca.periodoAcademico}`,
    banca.turma ? `Turma: ${banca.turma}` : '',
    '',
    banca.resumo ? `Resumo: ${banca.resumo.substring(0, 200)}...` : ''
  ].filter(Boolean).join('\\n')

  // Generate unique ID for the event
  const uid = `banca-${banca.id}-${Date.now()}@sisdef.ufba.br`

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UFBA//SISDEF//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:Defesa de TCC - ${banca.tituloTrabalho}`,
    `DESCRIPTION:${description}`,
    banca.local ? `LOCATION:${banca.local}` : '',
    'ORGANIZER:mailto:noreply@sisdef.ufba.br',
    'STATUS:CONFIRMED',
    'CLASS:PUBLIC',
    `CREATED:${formatDateForICS(new Date())}`,
    `LAST-MODIFIED:${formatDateForICS(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  return icsContent
}

/**
 * Generate Google Calendar URL for a banca defense
 */
export const generateGoogleCalendarUrl = (data: BancaCalendarData): string => {
  const { banca } = data
  
  const startDate = new Date(banca.dataRealizacao)
  const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000))

  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ format)
  const formatDateForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const startFormatted = formatDateForGoogle(startDate)
  const endFormatted = formatDateForGoogle(endDate)

  // Create event details
  const title = encodeURIComponent(`Defesa de TCC - ${banca.tituloTrabalho}`)
  const details = encodeURIComponent([
    `Autor: ${banca.autor}`,
    banca.orientador ? `Orientador: ${banca.orientador.nome}` : '',
    banca.curso ? `Curso: ${banca.curso.nome}` : '',
    `Período: ${banca.periodoAcademico}`,
    banca.turma ? `Turma: ${banca.turma}` : ''
  ].filter(Boolean).join('\n'))

  const location = banca.local ? encodeURIComponent(banca.local) : ''

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details: details,
    location: location,
    trp: 'false'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Outlook Calendar URL for a banca defense
 */
export const generateOutlookUrl = (data: BancaCalendarData): string => {
  const { banca } = data
  
  const startDate = new Date(banca.dataRealizacao)
  const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000))

  // Format dates for Outlook (ISO format)
  const startFormatted = startDate.toISOString()
  const endFormatted = endDate.toISOString()

  const subject = encodeURIComponent(`Defesa de TCC - ${banca.tituloTrabalho}`)
  const body = encodeURIComponent([
    `Autor: ${banca.autor}`,
    banca.orientador ? `Orientador: ${banca.orientador.nome}` : '',
    banca.curso ? `Curso: ${banca.curso.nome}` : '',
    `Período: ${banca.periodoAcademico}`,
    banca.turma ? `Turma: ${banca.turma}` : '',
    '',
    banca.resumo ? `Resumo: ${banca.resumo.substring(0, 200)}...` : ''
  ].filter(Boolean).join('\n'))

  const location = banca.local ? encodeURIComponent(banca.local) : ''

  const params = new URLSearchParams({
    subject: subject,
    body: body,
    startdt: startFormatted,
    enddt: endFormatted,
    location: location
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate calendar invite data for different providers
 */
export const generateCalendarInvites = (data: BancaCalendarData) => {
  return {
    ics: generateICSContent(data),
    googleUrl: generateGoogleCalendarUrl(data),
    outlookUrl: generateOutlookUrl(data)
  }
}