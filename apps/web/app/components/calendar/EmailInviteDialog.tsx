import { useState } from "react"
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
import { Mail, Loader2 } from "lucide-react"
import { useSendCalendarInvite } from "@/hooks/calendar.hooks"

interface EmailInviteDialogProps {
  bancaId: string
  isOpen: boolean
  onClose: () => void
  bancaTitle: string
}

export function EmailInviteDialog({ bancaId, isOpen, onClose, bancaTitle }: EmailInviteDialogProps) {
  const [email, setEmail] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [emailError, setEmailError] = useState("")

  const sendInviteMutation = useSendCalendarInvite()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setEmailError("Email é obrigatório")
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError("Email inválido")
      return
    }
    
    setEmailError("")
    
    sendInviteMutation.mutate({
      bancaId,
      email: email.trim(),
      recipientName: recipientName.trim() || undefined
    }, {
      onSuccess: () => {
        setEmail("")
        setRecipientName("")
        onClose()
      }
    })
  }

  const handleClose = () => {
    if (!sendInviteMutation.isPending) {
      setEmail("")
      setRecipientName("")
      setEmailError("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Convite por Email
          </DialogTitle>
          <DialogDescription>
            Envie um convite para adicionar a defesa "{bancaTitle}" ao calendário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
              className={emailError ? "border-red-500" : ""}
              disabled={sendInviteMutation.isPending}
              required
            />
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome do destinatário (opcional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome completo"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              disabled={sendInviteMutation.isPending}
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
            <p className="font-medium mb-1">O que será enviado:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Email com detalhes completos da defesa</li>
              <li>Arquivo .ics anexo para qualquer calendário</li>
              <li>Compatível com Google, Outlook, Apple Calendar e outros</li>
            </ul>
          </div>
        </form>

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={sendInviteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={sendInviteMutation.isPending || !email.trim()}
            className="w-full sm:w-auto"
          >
            {sendInviteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Convite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}