import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, Calendar, FileText, Settings } from "lucide-react"
import { Link } from "react-router"

export default function AdminIndex() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
        <p className="text-muted-foreground">
          Gerencie todos os aspectos do sistema de bancas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gerenciamento de Usuários */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>
                  Gerencie usuários do sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize, edite e gerencie todos os usuários cadastrados no sistema.
            </p>
            <Button asChild className="w-full">
              <Link to="/admin/users">
                Gerenciar Usuários
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Convites de Professores */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Convites de Professores</CardTitle>
                <CardDescription>
                  Envie convites para novos professores
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Crie e gerencie convites para professores se juntarem ao sistema.
            </p>
            <Button asChild className="w-full">
              <Link to="/admin/teacher-invites">
                Gerenciar Convites
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Bancas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Bancas</CardTitle>
                <CardDescription>
                  Gerencie bancas de defesa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize e gerencie todas as bancas de defesa do sistema.
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                Ver Bancas
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Gerencie documentos do sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize e gerencie documentos relacionados às bancas.
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                Gerenciar Documentos
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configurações do sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure parâmetros e preferências do sistema.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/">
                Configurações
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}