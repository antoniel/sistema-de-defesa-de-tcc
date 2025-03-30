"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React, { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
// Assuming you might want a Header component as well
// import { Header } from "@/components/layout/Header";

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isInviteFlow = searchParams.has("inv") // Check if 'inv' query param exists

  // --- Form State ---
  const [nome, setNome] = useState("")
  const [pronoun, setPronoun] = useState<string>()
  const [email, setEmail] = useState("")
  const [universidade, setUniversidade] = useState("")
  const [academicTitle, setAcademicTitle] = useState("")
  const [registrationId, setRegistrationId] = useState("") // Only relevant if !isInviteFlow
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false) // Basic loading state
  const [error, setError] = useState<string | null>(null) // Basic error state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = {
      nome,
      pronoun,
      email,
      universidade,
      academic_title: academicTitle,
      username,
      password,
      // Conditionally include registration_id
      ...(!isInviteFlow && { registration_id: registrationId }),
      // Include invite hash if present (needed for backend)
      ...(isInviteFlow && { hash: searchParams.get("inv") }),
    }

    console.log("Registration Form Data:", formData)

    // --- TODO: API Interaction ---
    // 1. Check if user exists (optional, backend might handle)
    // 2. Call register mutation
    // Example:
    // try {
    //   await registerMutation.mutateAsync(formData);
    //   // Handle success (e.g., navigate to login or dashboard)
    //   navigate('/login'); // Or wherever appropriate
    // } catch (err) {
    //   setError(err.message || "Failed to register.");
    // } finally {
    //   setIsLoading(false);
    // }

    // Placeholder logic
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    console.log("Simulated registration successful.")
    setIsLoading(false)
    // navigate('/login'); // Example navigation on success
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      {/* Optional: <Header /> */}
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">Crie sua conta</h2>
          {/* Add subtitle if needed */}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* Gênero */}
          <div>
            <Label htmlFor="pronoun">Gênero</Label>
            <Select value={pronoun} onValueChange={setPronoun} required>
              <SelectTrigger id="pronoun">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Masculino</SelectItem>
                <SelectItem value="1">Feminino</SelectItem>
                {/* Add other options if necessary */}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          {/* Universidade */}
          <div>
            <Label htmlFor="universidade">Universidade</Label>
            <Input
              id="universidade"
              type="text"
              value={universidade}
              onChange={(e) => setUniversidade(e.target.value)}
              placeholder="Nome da sua universidade"
              required
            />
          </div>

          {/* Título Acadêmico */}
          <div>
            <Label htmlFor="academic_title">Título Acadêmico</Label>
            <Input
              id="academic_title"
              type="text"
              value={academicTitle}
              onChange={(e) => setAcademicTitle(e.target.value)}
              placeholder="Ex: Doutor, Mestre, Bacharel"
              required
            />
          </div>

          {/* Matrícula (Conditional) */}
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
              />
            </div>
          )}

          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Escolha um nome de usuário"
              required
            />
          </div>

          {/* Senha */}
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              required
            />
            {/* Add password confirmation field if needed */}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Submit Button */}
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </div>

          {/* Link to Login */}
          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
              Faça login
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
