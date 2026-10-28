export interface BaseEmailProps {
  title: string
  content: string
  buttonText?: string
  buttonUrl?: string
  variant?: 'default' | 'destructive'
  /** Conteúdo renderizado depois do botão (avisos, prazos etc.). */
  afterButton?: string
  /** Texto curto exibido na prévia da caixa de entrada (oculto no corpo). */
  preheader?: string
}

// Using design system colors - converting HSL to hex for email compatibility
export const emailColors = {
  primary: '#1a1a1a', // --primary: 24 9.8% 10%
  primaryForeground: '#fafaf9', // --primary-foreground: 60 9.1% 97.8%
  secondary: '#f4f4f5', // --secondary: 60 4.8% 95.9%
  destructive: '#dc2626', // --destructive: 0 84.2% 60.2%
  destructiveForeground: '#fafaf9', // --destructive-foreground: 60 9.1% 97.8%
  muted: '#71717a', // --muted-foreground: 25 5.3% 44.7%
  border: '#e4e4e7', // --border: 20 5.9% 90%
  background: '#ffffff', // --background: 0 0% 100%
  foreground: '#0a0a0a', // --foreground: 20 14.3% 4.1%
}

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

export const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Estilos inline reutilizáveis pelos templates. O Gmail e outros clientes descartam o
 * bloco <style> com frequência, então tudo que importa visualmente precisa estar inline.
 */
export const emailStyles = {
  h2: `margin: 0 0 16px 0; font-size: 20px; line-height: 1.3; font-weight: 600; color: ${emailColors.foreground};`,
  p: `margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${emailColors.foreground};`,
  muted: `margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: ${emailColors.muted};`,
  callout: `margin: 0 0 24px 0; padding: 16px; background: ${emailColors.secondary}; border-left: 4px solid ${emailColors.primary}; border-radius: 6px;`,
  calloutLabel: `margin: 0 0 4px 0; font-size: 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em; color: ${emailColors.muted};`,
  calloutValue: `margin: 0; font-size: 16px; line-height: 1.5; font-weight: 600; color: ${emailColors.foreground};`,
  link: `color: ${emailColors.primary}; text-decoration: underline;`,
  warning: 'margin: 20px 0; padding: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; color: #92400e;',
  linkFallback: `margin: 8px 0 0 0; padding: 12px; background: ${emailColors.secondary}; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all; color: ${emailColors.foreground};`,
}

const renderButton = (text: string, url: string, background: string, color: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px 0;">
    <tr>
      <td align="center" bgcolor="${background}" style="border-radius: 8px;">
        <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${FONT_STACK}; font-size: 16px; font-weight: 600; color: ${color}; text-decoration: none; border-radius: 8px;">${text}</a>
      </td>
    </tr>
  </table>
`

const renderLinkFallback = (url: string) => `
  <p style="margin: 24px 0 4px 0; font-size: 13px; line-height: 1.5; color: ${emailColors.muted};">Se o botão não funcionar, copie e cole este link no navegador:</p>
  <p style="${emailStyles.linkFallback}">${url}</p>
`

export const createBaseEmailTemplate = (props: BaseEmailProps): string => {
  const { title, content, buttonText, buttonUrl, variant = 'default', preheader, afterButton } = props
  const colors = emailColors

  const headerColor = variant === 'destructive' ? colors.destructive : colors.primary
  const buttonColor = variant === 'destructive' ? colors.destructive : colors.primary
  const buttonTextColor = variant === 'destructive' ? colors.destructiveForeground : colors.primaryForeground

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Sistema Banca</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${colors.secondary}; font-family: ${FONT_STACK};">
      ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>` : ''}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${colors.secondary};">
        <tr>
          <td align="center" style="padding: 32px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="background-color: ${headerColor}; padding: 24px 32px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.4; letter-spacing: 0.08em; text-transform: uppercase; color: ${colors.primaryForeground}; opacity: 0.75;">Sistema Banca · IC-UFBA</p>
                  <p style="margin: 4px 0 0 0; font-size: 22px; line-height: 1.3; font-weight: 600; color: ${colors.primaryForeground};">${title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.6; color: ${colors.foreground};">
                  ${content}
                  ${buttonText && buttonUrl ? renderButton(buttonText, buttonUrl, buttonColor, buttonTextColor) : ''}
                  ${afterButton ?? ''}
                  ${buttonText && buttonUrl ? renderLinkFallback(buttonUrl) : ''}
                </td>
              </tr>
              <tr>
                <td style="background-color: ${colors.secondary}; border-top: 1px solid ${colors.border}; padding: 20px 32px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${colors.muted};">Sistema Banca - Gerenciamento de Bancas de TCC<br/>Instituto de Computação - UFBA</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
