import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import React, { useState } from "react"
import { useNavigate } from "react-router"
import { loginUser, storeAuthToken } from "../services/authService" // Adjust import path if needed

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null) // Clear previous errors
    setLoading(true)

    try {
      const { token /*, user */ } = await loginUser(username, password) // Call the service

      // Store token (e.g., in localStorage)
      storeAuthToken(token)

      // Optional: Store user info (e.g., in context or state management)
      // setUserContext(user);

      // Navigate to homepage on success
      navigate("/")
    } catch (err) {
      // Display error message from the service - Keep API error messages as they are, or provide a generic Portuguese error
      // Option 1: Keep API error message
      // setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.")
      // Option 2: Generic Portuguese error (use this if API messages are not user-friendly)
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.") // Using API message for now
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14))] items-center justify-center p-4">
      {" "}
      {/* Adjust min-h based on header height */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Insira seu usuário abaixo para entrar na sua conta.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="exemplo@ufba.br"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
