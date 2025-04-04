import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { removeAuthToken } from "@/services/authService"
import { useUser } from "@/services/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { GraduationCap, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { match } from "ts-pattern"

export function Header(p: { className?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user, isLoading, isError } = useUser()

  const handleLogout = () => {
    useUser.removeQueries(queryClient)
    removeAuthToken()
    navigate("/")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        p.className
      )}
    >
      <div className="container flex h-14 items-center">
        {/* Left Side: Logo and Title */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold sm:inline-block">Sistema de Defesas de TCC</span>
        </Link>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isLoading ? (
            <span>Loading...</span>
          ) : user && !isError ? (
            <>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Olá, {user.nome || "Usuário"}</span>
                {user.role && (
                  <Badge variant="outline">
                    {match(user.role)
                      .with("TEACHER", () => "Professor")
                      .with("STUDENT", () => "Aluno")
                      .with("ADMIN", () => "Administrador")
                      .exhaustive()}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="outline" onClick={() => navigate("/register")}>
                Registre-se
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
