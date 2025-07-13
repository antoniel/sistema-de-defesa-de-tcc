import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { useToast } from "~/hooks/use-toast"
import { api } from "~/lib/api"

interface TeacherInvite {
  id: number
  email: string
  nome: string
  school: string
  academicTitle: string
  status: string
  createdAt: string
  expiresAt: string
  acceptedAt?: string
}

export default function AdminTeacherInvites() {
  const [invites, setInvites] = useState<TeacherInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    school: "",
    academicTitle: "",
  })
  const { toast } = useToast()

  const loadInvites = async () => {
    try {
      const response = await api.get("/teacher-invite")
      setInvites(response.data.data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar convites",
        variant: "destructive",
      })
    }
  }

  const createInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post("/teacher-invite", formData)
      
      toast({
        title: "Sucesso",
        description: "Convite criado com sucesso",
      })

      // Limpar formulário
      setFormData({
        email: "",
        nome: "",
        school: "",
        academicTitle: "",
      })

      // Recarregar lista
      await loadInvites()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Erro ao criar convite",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar convites ao montar o componente
  useEffect(() => {
    loadInvites()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "accepted":
        return "text-green-600 bg-green-100"
      case "expired":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "accepted":
        return "Aceito"
      case "expired":
        return "Expirado"
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Convites de Professores</h1>
        <Button onClick={loadInvites} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Formulário para criar convite */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Convite</CardTitle>
          <CardDescription>
            Preencha os dados do professor para enviar um convite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">Instituição</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicTitle">Título Acadêmico</Label>
                <Select
                  value={formData.academicTitle}
                  onValueChange={(value: string) => setFormData({ ...formData, academicTitle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o título" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Graduação">Graduação</SelectItem>
                    <SelectItem value="Especialização">Especialização</SelectItem>
                    <SelectItem value="Mestrado">Mestrado</SelectItem>
                    <SelectItem value="Doutorado">Doutorado</SelectItem>
                    <SelectItem value="Pós-Doutorado">Pós-Doutorado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Convite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Lista de todos os convites enviados e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invites.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum convite encontrado
              </p>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{invite.nome}</h3>
                      <p className="text-sm text-gray-600">{invite.email}</p>
                      <p className="text-sm text-gray-600">
                        {invite.school} • {invite.academicTitle}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        invite.status
                      )}`}
                    >
                      {getStatusText(invite.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Criado em: {new Date(invite.createdAt).toLocaleDateString()}</p>
                    <p>Expira em: {new Date(invite.expiresAt).toLocaleDateString()}</p>
                    {invite.acceptedAt && (
                      <p>Aceito em: {new Date(invite.acceptedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}