import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useUser } from "@/services/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { GraduationCap, LogOut } from "lucide-react"
import React from "react"
import { Link } from "react-router"
import { match } from "ts-pattern"
import { LoginForm } from "../auth/LoginForm"
import { RegisterForm } from "../auth/RegisterForm"
import { DialogDescription, DialogHeader, DialogTrigger } from "../ui/dialog"

interface HeaderProps {
  className?: string
}

export function Header(props: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        props.className
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Left Side: Logo and Title */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold sm:inline-block">Sistema de Defesas de TCC</span>
        </Link>

        {/* Right Side: Action Buttons */}
        <RightSideButtons />
      </div>
    </header>
  )
}
function RightSideButtons() {
  const queryClient = useQueryClient()
  const { data: user, isLoading, isError } = useUser()
  const handleLogout = () => {
    useUser.removeQueries(queryClient)
  }
  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Carregando...</span>
  }
  if (isError) {
    return <span className="text-sm text-muted-foreground">Erro ao carregar usuário</span>
  }
  if (!user) {
    return <LoggedOutButtons />
  }
  return (
    <div className="ml-auto flex items-center gap-2">
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
    </div>
  )
}

function LoggedOutButtons() {
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = React.useState(false)
  return (
    <div className="ml-auto">
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">Login</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>Insira seu email e senha para acessar sua conta.</DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Regitre-se</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Conta</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para se registrar.</DialogDescription>
          </DialogHeader>
          <RegisterForm onSuccess={() => setRegisterDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
