import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/services/useUser"
import { Mail, Paperclip } from "lucide-react"
import { useState } from "react"

interface CeagEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: CeagEmailData) => void
  isLoading?: boolean
  bancaInfo?: {
    autor: string
    tituloTrabalho: string
    curso: { nome: string }
    membros: Array<{ role: string; usuario: { nome: string } }>
  }
}

export interface CeagEmailData {
  ceapgEmail: string
  senderName: string
  senderEmail: string
  message: string
}

export function CeagEmailModal({ isOpen, onClose, onConfirm, isLoading = false, bancaInfo }: CeagEmailModalProps) {
  const { data: user } = useUser()
  const [ceapgEmail, setCeagEmail] = useState(import.meta.env.PROD ? "ceag-ic@ufba.br" : "antoinel2210@gmail.com")
  const [senderName, setSenderName] = useState(user?.nome || "")
  const [senderEmail, setSenderEmail] = useState(user?.email || "")
  const defaultMessage = `Prezados coleagas do CEAG,

Seguem as declarações para a assinatura por parte dos coordenadores do Colegiado.

Os documentos estão anexados a este e-mail para sua análise e providências necessárias.

Atenciosamente,
Sistema de Defesas (SISDEF)
Universidade Federal da Bahia`
  const [message, setMessage] = useState(defaultMessage)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      ceapgEmail,
      senderName,
      senderEmail,
      message,
    })
  }

  const attachments = ["Formulário de Avaliação.pdf", "Declaração de Participação.pdf", "Declaração de Orientação.pdf"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Confirmar Envio para CEAG
          </DialogTitle>
          <DialogDescription>Revise os dados abaixo antes de enviar as declarações para o CEAG.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Banca */}
          {bancaInfo && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Informações da Banca</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Autor:</span> {bancaInfo.autor}
                </p>
                <p>
                  <span className="font-medium">Trabalho:</span> {bancaInfo.tituloTrabalho}
                </p>
                <p>
                  <span className="font-medium">Curso:</span> {bancaInfo.curso.nome}
                </p>
              </div>
            </div>
          )}

          {/* Destinatário */}
          <div className="space-y-2">
            <Label htmlFor="ceapgEmail">Para (Destinatário)</Label>
            <Input
              id="ceapgEmail"
              type="email"
              value={ceapgEmail}
              onChange={(e) => setCeagEmail(e.target.value)}
              placeholder="ceag-ic@ufba.br"
              required
            />
          </div>

          {/* Dados do Remetente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Seu Nome</Label>
              <Input
                id="senderName"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Seu Email (Cópia)</Label>
              <Input
                id="senderEmail"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Arquivos Anexos
            </Label>
            <div className="bg-muted/30 p-3 rounded-lg">
              <ul className="space-y-1 text-sm">
                {attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {attachment}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mensagem do Email */}
          <div className="space-y-2">
            <Label>Mensagem do Email</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[160px]" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
