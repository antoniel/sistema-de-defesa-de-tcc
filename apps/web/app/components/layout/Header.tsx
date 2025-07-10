import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { removeAuthToken } from "@/services/authService"
import { useUser } from "@/services/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, LogOut, Menu, User, Users, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { match } from "ts-pattern"
import { LoginForm } from "../auth/LoginForm"
import { RegisterForm } from "../auth/RegisterForm"
import { DialogDescription, DialogHeader } from "../ui/dialog"

interface HeaderProps {
  className?: string
}

export function Header(props: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        props.className
      )}
      role="banner"
      aria-label="Cabeçalho principal"
    >
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left Side: Logo and Title */}
        <Link
          to="/"
          className="mr-6 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
          aria-label="Ir para página inicial"
        >
          <img
            src="/icc-ufba.png"
            alt="Logo do Instituto de Computação da UFBA"
            className="h-9 w-6"
            aria-hidden="true"
          />
          <span className="font-bold text-sm sm:text-base lg:inline-block">Sistema de Defesas de TCC</span>
        </Link>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <RightSideButtons
            loginDialogOpen={loginDialogOpen}
            setLoginDialogOpen={setLoginDialogOpen}
            registerDialogOpen={registerDialogOpen}
            setRegisterDialogOpen={setRegisterDialogOpen}
          />
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 right-0 bg-background border-b lg:hidden"
            role="navigation"
            aria-label="Menu de navegação móvel"
          >
            <div className="container px-4 py-4 space-y-2">
              <MobileRightSideButtons
                onClose={() => setMobileMenuOpen(false)}
                setLoginDialogOpen={setLoginDialogOpen}
                setRegisterDialogOpen={setRegisterDialogOpen}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shared Dialogs - Outside mobile menu so they persist when menu closes */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>Insira seu email e senha para acessar sua conta.</DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Conta</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para se registrar.</DialogDescription>
          </DialogHeader>
          <RegisterForm onSuccess={() => setRegisterDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  )
}

interface RightSideButtonsProps {
  loginDialogOpen: boolean
  setLoginDialogOpen: (open: boolean) => void
  registerDialogOpen: boolean
  setRegisterDialogOpen: (open: boolean) => void
}

function RightSideButtons(props: RightSideButtonsProps) {
  const queryClient = useQueryClient()
  const { data: user, isLoading, isError } = useUser()
  const handleLogout = () => {
    removeAuthToken()
    useUser.removeQueries(queryClient)
  }

  if (isLoading) {
    return (
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Carregando...
      </span>
    )
  }

  if (isError) {
    return (
      <span className="text-sm text-muted-foreground" role="alert">
        Erro ao carregar usuário
      </span>
    )
  }

  if (!user) {
    return <LoggedOutButtons {...props} />
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`Menu do usuário: ${user.nome || "Usuário"}`}
          >
            <span className="font-medium hidden sm:inline">Olá, {user.nome || "Usuário"}</span>
            <span className="font-medium sm:hidden">{user.nome?.split(" ")[0] || "Usuário"}</span>
            {user.role && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {match(user.role)
                  .with("TEACHER", () => "Professor")
                  .with("STUDENT", () => "Aluno")
                  .with("ADMIN", () => "Administrador")
                  .exhaustive()}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="flex w-full items-center focus:bg-accent focus:text-accent-foreground"
              onClick={() => (document.activeElement as HTMLElement)?.blur?.()}
            >
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              Meu Perfil
            </Link>
          </DropdownMenuItem>

          {user.role === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/users"
                  className="flex w-full items-center focus:bg-accent focus:text-accent-foreground"
                  onClick={() => (document.activeElement as HTMLElement)?.blur?.()}
                >
                  <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                  Gerenciar Usuários
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleLogout()
              }
            }}
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface MobileRightSideButtonsProps {
  onClose: () => void
  setLoginDialogOpen: (open: boolean) => void
  setRegisterDialogOpen: (open: boolean) => void
}

function MobileRightSideButtons(props: MobileRightSideButtonsProps) {
  const queryClient = useQueryClient()
  const { data: user, isLoading, isError } = useUser()
  const handleLogout = () => {
    removeAuthToken()
    useUser.removeQueries(queryClient)
    props.onClose()
  }

  if (isLoading) {
    return (
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Carregando...
      </span>
    )
  }

  if (isError) {
    return (
      <span className="text-sm text-muted-foreground" role="alert">
        Erro ao carregar usuário
      </span>
    )
  }

  if (!user) {
    return <MobileLoggedOutButtons {...props} />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2">
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

      <div className="space-y-1">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link to="/profile" onClick={props.onClose} className="flex items-center">
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            Meu Perfil
          </Link>
        </Button>

        {user.role === "ADMIN" && (
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/admin/users" onClick={props.onClose} className="flex items-center">
              <Users className="mr-2 h-4 w-4" aria-hidden="true" />
              Gerenciar Usuários
            </Link>
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </div>
    </div>
  )
}

function LoggedOutButtons(props: RightSideButtonsProps) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Button
        variant="ghost"
        className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => props.setLoginDialogOpen(true)}
      >
        Login
      </Button>

      <Button
        variant="outline"
        className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => props.setRegisterDialogOpen(true)}
      >
        Registre-se
      </Button>
    </div>
  )
}

function MobileLoggedOutButtons(props: MobileRightSideButtonsProps) {
  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          props.setLoginDialogOpen(true)
          props.onClose()
        }}
      >
        Login
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => {
          props.setRegisterDialogOpen(true)
          props.onClose()
        }}
      >
        Registre-se
      </Button>
    </div>
  )
}
