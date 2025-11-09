import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, School, Users, EyeOff } from "lucide-react"
import { useNavigate } from "react-router"
import { href } from "react-router"

type BancaWithRole = {
  id: number
  tituloTrabalho: string
  dataRealizacao: string | Date
  autor: string
  local: string | null
  modalidade: "remoto" | "local"
  visible: boolean
  userRole: "orientador" | "coorientador" | "aluno" | "avaliador"
  curso: {
    id: number
    nome: string
    sigla: string
  }
  membros: Array<{
    id: number
    role: "orientador" | "coorientador" | "aluno" | "avaliador"
    usuario: {
      id: number
      nome: string
      email: string
    }
  }>
}

type UserBancaListProps = {
  bancas: BancaWithRole[]
  userRole: "STUDENT" | "TEACHER" | "ADMIN"
  isAdmin: boolean
}

const roleLabels: Record<"orientador" | "coorientador" | "aluno" | "avaliador", string> = {
  orientador: "Orientador",
  coorientador: "Coorientador",
  aluno: "Aluno",
  avaliador: "Avaliador",
}

const roleGroupLabels: Record<"orientador" | "coorientador" | "aluno" | "avaliador", string> = {
  orientador: "Bancas como Orientador",
  coorientador: "Bancas como Coorientador",
  aluno: "Bancas como Aluno",
  avaliador: "Bancas como Avaliador",
}

export function UserBancaList({ bancas, userRole, isAdmin }: UserBancaListProps) {
  const navigate = useNavigate()

  if (bancas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium mb-2">
          {userRole === "TEACHER"
            ? "Nenhuma participação em bancas"
            : userRole === "STUDENT"
              ? "Nenhuma defesa realizada"
              : "Nenhuma participação em bancas"}
        </p>
        <p className="text-sm">
          {userRole === "TEACHER"
            ? "Este professor ainda não participou de nenhuma banca como orientador, coorientador ou avaliador."
            : userRole === "STUDENT"
              ? "Este aluno ainda não defendeu nenhuma banca."
              : "Este usuário ainda não participou de nenhuma banca."}
        </p>
      </div>
    )
  }

  // Group bancas by role for teachers with multiple roles
  const shouldGroupByRole = userRole === "TEACHER" || userRole === "ADMIN"
  const roles = bancas.map((b) => b.userRole)
  const uniqueRoles = Array.from(new Set(roles))
  const hasMultipleRoles = uniqueRoles.length > 1

  const handleBancaClick = (bancaId: number) => {
    navigate(href("/banca/:id", { id: String(bancaId) }))
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getOtherMembers = (banca: BancaWithRole) => {
    return banca.membros.filter((m) => m.role !== banca.userRole)
  }

  if (shouldGroupByRole && hasMultipleRoles) {
    // Group by role
    const groupedBancas = uniqueRoles.reduce(
      (acc, role) => {
        acc[role] = bancas.filter((b) => b.userRole === role)
        return acc
      },
      {} as Record<"orientador" | "coorientador" | "aluno" | "avaliador", BancaWithRole[]>
    )

    return (
      <div className="space-y-6">
        {uniqueRoles.map((role) => (
          <div key={role}>
            <h3 className="text-lg font-semibold mb-3">{roleGroupLabels[role]}</h3>
            <div className="space-y-3">
              {groupedBancas[role].map((banca) => (
                <BancaCard
                  key={banca.id}
                  banca={banca}
                  isAdmin={isAdmin}
                  onClick={() => handleBancaClick(banca.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Flat list for single role or students
  return (
    <div className="space-y-3">
      {bancas.map((banca) => (
        <BancaCard key={banca.id} banca={banca} isAdmin={isAdmin} onClick={() => handleBancaClick(banca.id)} />
      ))}
    </div>
  )
}

function BancaCard({
  banca,
  isAdmin,
  onClick,
}: {
  banca: BancaWithRole
  isAdmin: boolean
  onClick: () => void
}) {
  const otherMembers = banca.membros.filter((m) => m.role !== banca.userRole)
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline">{roleLabels[banca.userRole]}</Badge>
            {isAdmin && !banca.visible && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Não visível
              </Badge>
            )}
          </div>
          <h4 className="font-semibold text-base">{banca.tituloTrabalho}</h4>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(banca.dataRealizacao)}
            </div>
            <div className="flex items-center gap-1">
              <School className="h-4 w-4" />
              {banca.curso.sigla}
            </div>
            {banca.local && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {banca.local} ({banca.modalidade === "remoto" ? "Remoto" : "Presencial"})
              </div>
            )}
          </div>
          {otherMembers.length > 0 && (
            <div className="flex items-start gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4 mt-0.5" />
              <span>
                Outros participantes: {otherMembers.map((m) => m.usuario.nome).join(", ")}
              </span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}>
          Ver detalhes
        </Button>
      </div>
    </div>
  )
}

