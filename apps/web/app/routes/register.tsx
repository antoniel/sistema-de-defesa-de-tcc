"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import React, { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useRegisterMutation } from "../services/authService"

export default function RegisterPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isInviteFlow = searchParams.has("inv")

  const [nome, setNome] = useState("")
  const [pronoun, setPronoun] = useState<string>()
  const [email, setEmail] = useState("")
  const [universidade, setUniversidade] = useState("")
  const [academicTitle, setAcademicTitle] = useState("")
  const [registrationId, setRegistrationId] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const { mutate: registerUser, isPending, error } = useRegisterMutation()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    registerUser(
      {
        json: {
          email,
          password,
          nome,
          school: universidade,
          academicTitle,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Conta criada com sucesso",
          })
        },
      }
    )
  }

  const errorMessage = error instanceof Error ? error.message : null

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">Crie sua conta</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="pronoun">Gênero</Label>
            <Select value={pronoun} onValueChange={setPronoun} required disabled={isPending}>
              <SelectTrigger id="pronoun">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Masculino</SelectItem>
                <SelectItem value="1">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="universidade">Universidade</Label>
            <Input
              id="universidade"
              type="text"
              value={universidade}
              onChange={(e) => setUniversidade(e.target.value)}
              placeholder="Nome da sua universidade"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="academic_title">Título Acadêmico</Label>
            <Input
              id="academic_title"
              type="text"
              value={academicTitle}
              onChange={(e) => setAcademicTitle(e.target.value)}
              placeholder="Ex: Doutor, Mestre, Bacharel"
              required
              disabled={isPending}
            />
          </div>

          {!isInviteFlow && (
            <div>
              <Label htmlFor="registration_id">Matrícula</Label>
              <Input
                id="registration_id"
                type="text"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="Sua matrícula (se aplicável)"
                required={!isInviteFlow}
                disabled={isPending}
              />
            </div>
          )}

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Escolha um nome de usuário"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              required
              disabled={isPending}
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar"}
            </Button>
          </div>

          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/login")} disabled={isPending}>
              Faça login
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
