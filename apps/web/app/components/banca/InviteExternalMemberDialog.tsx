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
import { useCreateTeacherInvitation } from "@/hooks"
import { useState } from "react"

interface InviteExternalMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited: (member: { id: number; nome: string }) => void
  idPrefix?: string
}

export function InviteExternalMemberDialog(props: InviteExternalMemberDialogProps) {
  const inviteMutation = useCreateTeacherInvitation()
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const idPrefix = props.idPrefix ?? "invite-external"

  function reset() {
    setEmail("")
    setNome("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    inviteMutation.mutate(
      { email, nome },
      {
        onSuccess: (res) => {
          props.onInvited({ id: res.data.userId, nome })
          reset()
          props.onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) reset()
        props.onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro externo</DialogTitle>
          <DialogDescription>
            O membro externo receberá um email para completar o cadastro. Você já pode selecioná-lo como avaliador nesta
            banca.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor={`${idPrefix}-nome`}>Nome</Label>
            <Input
              id={`${idPrefix}-nome`}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-email`}>Email</Label>
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
