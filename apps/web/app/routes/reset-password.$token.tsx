import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useResetPasswordMutation } from "@/services/authService"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"

interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const resetPasswordMutation = useResetPasswordMutation()
  const [isSuccess, setIsSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const password = watch("password")

  useEffect(() => {
    if (!token) {
      navigate("/")
      return
    }

    // Token validation would happen here if needed
    // For now, we'll assume it's valid and let the backend handle validation
    setTokenValid(true)
  }, [token, navigate])

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) return

    resetPasswordMutation.mutate(
      { json: { token, newPassword: data.password } },
      {
        onSuccess: () => {
          setIsSuccess(true)
          toast({
            title: "Senha redefinida com sucesso ✅",
            description: "Sua senha foi alterada. Você pode fazer login agora.",
          })
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/")
          }, 3000)
        },
        onError: (error) => {
          toast({
            title: "Erro ao redefinir senha ❌",
            description: error.message || "Ocorreu um erro ao redefinir a senha",
          })
        },
      }
    )
  }

  if (tokenValid === null) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Verificando token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Senha Redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua nova senha"
                disabled={resetPasswordMutation.isPending}
                {...register("password", {
                  required: "Nova senha é obrigatória",
                  minLength: {
                    value: 8,
                    message: "A senha deve ter pelo menos 8 caracteres",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                disabled={resetPasswordMutation.isPending}
                {...register("confirmPassword", {
                  required: "Confirmação de senha é obrigatória",
                  validate: (value) =>
                    value === password || "As senhas não coincidem",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
              disabled={resetPasswordMutation.isPending}
            >
              Voltar ao Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}