import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLoginMutation } from "@/services/authService"
import { useUser } from "@/services/useUser"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"

interface LoginFormValues {
  email: string
  password: string
}

export function LoginForm(p: { onSuccess?: () => void }) {
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { json: { email: data.email, password: data.password } },
      {
        onSuccess: (res) => {
          toast({
            title: "Login realizado com sucesso ✅",
            description: "Você foi redirecionado para a página inicial",
          })
          useUser.setData(queryClient, res.user)
          p.onSuccess?.()
        },
        onError: (error) => {
          toast({
            title: "Erro ao fazer login ❌",
            description: "Ocorreu um erro ao fazer login",
          })
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {loginMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Login</AlertTitle>
          <AlertDescription>
            {loginMutation.error.cause instanceof Error
              ? loginMutation.error.cause.message
              : loginMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="exemplo@ufba.br"
          disabled={loginMutation.isPending}
          {...register("email", {
            required: "Email é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Email inválido",
            },
          })}
        />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          type="password"
          disabled={loginMutation.isPending}
          {...register("password", {
            required: "Senha é obrigatória",
          })}
        />
        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
