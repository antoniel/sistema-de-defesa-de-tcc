import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { __DEV__ } from "@/config/env"
import { useToast } from "@/hooks/use-toast"
import { useRegisterMutation } from "@/services/authService"
import type { RegisterUserInput } from "@tcc/server"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { Form } from "../ui/form"

export function RegisterForm(p: { onSuccess?: () => void }) {
  const { mutate: registerUser, isPending, error } = useRegisterMutation()
  const form = useForm<RegisterUserInput>({
    defaultValues: {
      nome: __DEV__ ? "John Doe" : "",
      email: __DEV__ ? `john.doe+${Math.random()}@example.com` : "",
      school: __DEV__ ? "Universidade Federal da Bahia" : "Universidade Federal da Bahia",
      academicTitle: __DEV__ ? "Doutor" : "",
      password: __DEV__ ? "password" : "",
      matricula: __DEV__ ? "123456789" : "",
    },
  })
  const {
    register,
    formState: { errors },
  } = form

  const { toast } = useToast()
  const onSubmit = (data: RegisterUserInput) => {
    registerUser(
      {
        json: {
          email: data.email,
          password: data.password,
          nome: data.nome,
          school: data.school,
          academicTitle: data.academicTitle,
          matricula: data.matricula,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Conta criada com sucesso! ✅",
            description: "Você já pode fazer o login.",
          })
          p.onSuccess?.()
        },
      }
    )
  }

  const errorMessage =
    error instanceof Error ? (error.cause instanceof Error ? error.cause.message : error.message) : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Registro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div>
          <Label htmlFor="register-nome">Nome Completo</Label>
          <Input
            id="register-nome"
            placeholder="Seu nome completo"
            disabled={isPending}
            {...register("nome", { required: "Nome é obrigatório" })}
          />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="seu@email.com"
            disabled={isPending}
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

        <div>
          <Label htmlFor="register-universidade">Universidade</Label>
          <Input
            id="register-universidade"
            placeholder="Nome da sua universidade"
            disabled={isPending}
            {...register("school", { required: "Universidade é obrigatória" })}
          />
          {errors.school && <p className="text-sm text-destructive mt-1">{errors.school.message}</p>}
        </div>

        <div>
          <Label htmlFor="register-matricula">Matrícula</Label>
          <Input
            id="register-matricula"
            placeholder="Número de matrícula"
            disabled={isPending}
            {...register("matricula", { required: "Matrícula é obrigatória" })}
          />
          {errors.matricula && <p className="text-sm text-destructive mt-1">{errors.matricula.message}</p>}
        </div>

        <div>
          <Label htmlFor="register-academic_title">Título Acadêmico</Label>
          <Input
            id="register-academic_title"
            placeholder="Ex: Doutor, Mestre, Bacharel"
            disabled={isPending}
            {...register("academicTitle", { required: "Título acadêmico é obrigatório" })}
          />
          {errors.academicTitle && <p className="text-sm text-destructive mt-1">{errors.academicTitle.message}</p>}
        </div>

        <div>
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            type="password"
            placeholder="Crie uma senha segura"
            disabled={isPending}
            {...register("password", {
              required: "Senha é obrigatória",
              minLength: {
                value: 6,
                message: "A senha deve ter pelo menos 6 caracteres",
              },
            })}
          />
          {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar"}
        </Button>
      </form>
    </Form>
  )
}
