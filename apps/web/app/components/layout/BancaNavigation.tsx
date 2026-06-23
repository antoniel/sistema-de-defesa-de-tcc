import { Button } from "@/components/ui/button"
import type { AppUser } from "@/services/useUser"
import { ArrowLeft, BarChart3, FileText, User } from "lucide-react"
import { useNavigate } from "react-router"

interface BancaNavigationProps {
  id: string
  user?: AppUser | null
  currentPage: "detalhes" | "documentos" | "avaliacoes"
  children?: React.ReactNode
}

export function BancaNavigation(props: BancaNavigationProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center">
          <ArrowLeft className="2 h-4 w-4" /> Voltar
        </Button>

        {/* Navegação tipo tabs */}
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            className={`flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 ${
              props.currentPage === "detalhes"
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-muted-foreground/20"
            }`}
            onClick={() => navigate(`/banca/${props.id}`)}
          >
            <User className="h-4 w-4" />
            Detalhes
          </Button>

          {(props.user?.role === "ADMIN" || props.user?.role === "TEACHER") && (
            <Button
              variant="ghost"
              className={`flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 ${
                props.currentPage === "avaliacoes"
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted-foreground/20"
              }`}
              onClick={() => navigate(`/banca/${props.id}/avaliacoes`)}
            >
              <BarChart3 className="h-4 w-4" />
              Avaliações
            </Button>
          )}

          {(props.user?.role === "ADMIN" || props.user?.role === "TEACHER") && (
            <Button
              variant="ghost"
              className={`flex items-center gap-2 relative px-4 py-2 hover:bg-muted border-b-2 ${
                props.currentPage === "documentos"
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted-foreground/20"
              }`}
              onClick={() => navigate(`/banca/${props.id}/documentos`)}
            >
              <FileText className="h-4 w-4" />
              Documentos
            </Button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">{props.children}</div>
    </div>
  )
}
