import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useToast } from "~/hooks/use-toast"
import { api } from "~/lib/api"

interface InviteData {
  email: string
  nome: string
  school: string
  academicTitle: string
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido")
      setLoading(false)
      return
    }

    const validateInvite = async () => {
      try {
        const response = await api.get(`/teacher-invite/validate/${token}`)
        setInviteData(response.data.data)
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Erro ao validar convite"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    validateInvite()
  }, [token])

  const handleAcceptInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setAccepting(true)

    try {
      await api.post("/teacher-invite/accept", {
        token,
        password,
      })

      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso! Você pode fazer login agora.",
      })

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/auth/login")
      }, 2000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Erro ao aceitar convite"
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Convite Inválido</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth/login")} 
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados do convite
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema de Bancas!</CardTitle>
          <CardDescription>
            Você foi convidado para participar como professor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Informações do convite */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Dados do Convite</h3>
              <div className="mt-2 space-y-1 text-sm text-blue-800">
                <p><strong>Nome:</strong> {inviteData.nome}</p>
                <p><strong>Email:</strong> {inviteData.email}</p>
                <p><strong>Instituição:</strong> {inviteData.school}</p>
                <p><strong>Título:</strong> {inviteData.academicTitle}</p>
              </div>
            </div>

            {/* Formulário para criar senha */}
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Crie sua senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={accepting}
              >
                {accepting ? "Criando conta..." : "Aceitar Convite e Criar Conta"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Ao aceitar o convite, você concorda com os termos de uso do sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}