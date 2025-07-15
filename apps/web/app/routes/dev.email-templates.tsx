import { useState } from 'react'
import { createTeacherInvitationEmail, createPasswordResetEmail } from '@/lib/email-templates'
import type { MetaFunction } from 'react-router'

export const meta: MetaFunction = () => {
  return [
    { title: 'Email Templates - Dev Preview' },
    { name: 'description', content: 'Visualização dos templates de email em desenvolvimento' }
  ]
}

const templates = [
  {
    id: 'teacher-invitation',
    title: '🎓 Convite para Professor',
    description: 'Template enviado quando um professor é convidado para participar do sistema.',
    variant: 'default' as const,
    generator: () => createTeacherInvitationEmail({
      nome: 'Prof. João Silva',
      invitationUrl: 'https://sistema-banca.com/teacher-invitation/accept?token=exemplo-token-seguro'
    })
  },
  {
    id: 'password-reset',
    title: '🔒 Recuperação de Senha',
    description: 'Template enviado quando um usuário solicita a recuperação de senha.',
    variant: 'destructive' as const,
    generator: () => createPasswordResetEmail({
      nome: 'Maria Santos',
      resetUrl: 'https://sistema-banca.com/reset-password?token=exemplo-token-reset'
    })
  }
]

export default function EmailTemplatesPreview() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  // Só renderiza em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">404 - Página não encontrada</h1>
          <p className="text-muted-foreground">Esta página só está disponível em desenvolvimento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              📧 Email Templates - Dev Preview
            </h1>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                <strong>⚠️ Ambiente de Desenvolvimento:</strong> Esta página só está disponível em desenvolvimento.
              </p>
            </div>

            <p className="text-muted-foreground">
              Visualize os templates de email do sistema em diferentes contextos:
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {template.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTemplate(template.id)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      template.variant === 'destructive'
                        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    Ver Preview
                  </button>
                  <button
                    onClick={() => {
                      const html = template.generator()
                      const blob = new Blob([html], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${template.id}-template.html`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-4 py-2 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Baixar HTML
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Modal */}
          {activeTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    {templates.find(t => t.id === activeTemplate)?.title}
                  </h2>
                  <button
                    onClick={() => setActiveTemplate(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                    <iframe
                      srcDoc={templates.find(t => t.id === activeTemplate)?.generator()}
                      className="w-full h-96 border border-border rounded"
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Estes templates utilizam o design system do projeto com cores consistentes.
              O template de convite usa a cor primária, enquanto o de recuperação de senha usa a cor destrutiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}