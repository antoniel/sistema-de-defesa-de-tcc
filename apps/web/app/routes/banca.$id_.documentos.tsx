import { CeapgEmailModal, type CeapgEmailData } from "@/components/CeapgEmailModal"
import { BancaHeader } from "@/components/layout/BancaHeader"
import { BancaNavigation } from "@/components/layout/BancaNavigation"
import { Header } from "@/components/layout/Header"
import { PDFGenerator } from "@/components/pdf/pdf-generator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useBanca } from "@/hooks"
import { fileAvaliadores, useBancaDocumentInfo } from "@/hooks/documento.hooks"
import { useToast } from "@/hooks/use-toast"
import { useSendCeapgDeclarationsMutation } from "@/services/authService"
import { useUser } from "@/services/useUser"
import { pdf } from "@react-pdf/renderer"
import { DeclaracaoOrientacaoPDF, DeclaracaoParticipacaoPDF, FormularioAvaliacaoPDF } from "@tcc/pdf-components"
import { ArrowLeft, Download, Eye, FileText, Mail } from "lucide-react"
import React, { useState } from "react"
import { useNavigate, useParams } from "react-router"
import type { Route } from "./+types/banca.$id_.documentos"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Documentos da Banca" }]

export default function BancaDocumentosPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const sendCeapgMutation = useSendCeapgDeclarationsMutation()

  if (!id) {
    navigate("/")
    return
  }

  const userQuery = useUser()
  const bancaQuery = useBanca(id)
  const { data: bancaInfo } = useBancaDocumentInfo(parseInt(id))

  const user = userQuery.data
  const banca = bancaQuery.data

  // Verificar permissões: admin ou teacher
  const isAdmin = user?.role === "ADMIN"
  const isTeacher = user?.role === "TEACHER"
  const hasAccess = isAdmin || isTeacher

  const eligibleParticipants = fileAvaliadores(bancaInfo?.membros) || []

  const isLoading = bancaQuery.isLoading || userQuery.isLoading
  const error = bancaQuery.error || userQuery.error

  const generatePreview = async (type: "ata" | "participacao" | "orientacao", membroId?: number) => {
    if (!bancaInfo) return

    try {
      let pdfComponent: React.ReactElement
      let docName: string

      switch (type) {
        case "ata":
          pdfComponent = <FormularioAvaliacaoPDF bancaInfo={bancaInfo} />
          docName = "Formulário de Avaliação"
          break
        case "participacao":
          const participanteId =
            membroId ||
            selectedParticipant ||
            bancaInfo.membros.find((m) => m.role !== "aluno")?.id ||
            bancaInfo.membros[0]?.id
          if (!participanteId) return
          pdfComponent = <DeclaracaoParticipacaoPDF bancaInfo={bancaInfo} membroId={participanteId} />
          docName = "Declaração de Participação"
          break
        case "orientacao":
          const orientador = bancaInfo.membros.find((m) => m.role === "orientador")
          if (!orientador) return
          pdfComponent = <DeclaracaoOrientacaoPDF bancaInfo={bancaInfo} orientadorId={orientador.id} />
          docName = "Declaração de Orientação"
          break
        default:
          return
      }

      // Gerar PDF blob para preview
      const blob = await pdf(pdfComponent).toBlob()
      const url = URL.createObjectURL(blob)

      // Limpar preview anterior
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setPreviewUrl(url)
      setPreviewType(docName)
    } catch (error) {
      console.error("Erro ao gerar preview:", error)
    }
  }

  const handleSendCeapgEmail = async (emailData: CeapgEmailData) => {
    if (!id) return

    try {
      await sendCeapgMutation.mutateAsync({
        param: { bancaId: id },
        json: emailData,
      })

      toast({
        title: "Email enviado com sucesso!",
        description: "As declarações foram enviadas para o CEAPG.",
      })

      setIsEmailModalOpen(false)
    } catch (error) {
      console.error("Error sending CEAPG email:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Ocorreu um erro ao enviar as declarações. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <DocumentosPageSkeleton />
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
          <p>
            Você não tem permissão para acessar esta página. Apenas administradores e professores podem gerar
            documentos.
          </p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  if (error || !banca) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Header className="mb-6" />
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados da banca</h2>
          <p>{error instanceof Error ? error.message : "Erro desconhecido ao carregar dados da banca."}</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />

      <BancaNavigation id={id} user={user!} currentPage="documentos" />

      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        <BancaHeader
          title="Documentos da Banca"
          trabalho={banca.tituloTrabalho}
          autor={banca.autor}
          curso={banca.curso?.nome || ""}
        />

        {/* Conteúdo principal */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da esquerda - Controles */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Geração de Documentos Oficiais</h2>
                <p className="text-muted-foreground">
                  Gere e baixe os documentos oficiais da banca examinadora conforme os padrões da UFBA.
                </p>
              </div>

              <div className="space-y-4">
                {/* Ata de Defesa */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Formulário de Avaliação
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Formulário oficial para avaliação do trabalho de conclusão de curso.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePreview("ata")}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        if (!bancaInfo) return

                        try {
                          const pdfComponent = <FormularioAvaliacaoPDF bancaInfo={bancaInfo} />
                          const blob = await pdf(pdfComponent).toBlob()
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement("a")
                          link.href = url
                          link.download = "formulario-avaliacao.pdf"
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          URL.revokeObjectURL(url)
                        } catch (error) {
                          console.error("Erro ao gerar PDF:", error)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Declaração de Participação
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">Declaração para membros da banca examinadora.</p>

                  {eligibleParticipants.length > 0 && (
                    <div className="mb-3">
                      <label className="text-sm font-medium mb-2 block">Selecione o participante:</label>
                      <Select
                        value={selectedParticipant?.toString() || ""}
                        onValueChange={(value) => setSelectedParticipant(value ? Number(value) : null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha um participante" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleParticipants.map((membro) => (
                            <SelectItem key={membro.id} value={membro.id.toString()}>
                              {membro.usuario.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePreview("participacao")}
                      disabled={!selectedParticipant}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={async () => {
                        if (!bancaInfo || !selectedParticipant) return

                        try {
                          const pdfComponent = (
                            <DeclaracaoParticipacaoPDF bancaInfo={bancaInfo} membroId={selectedParticipant} />
                          )
                          const blob = await pdf(pdfComponent).toBlob()
                          const url = URL.createObjectURL(blob)
                          const link = document.createElement("a")
                          link.href = url
                          link.download = "declaracao-participacao.pdf"
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          URL.revokeObjectURL(url)
                        } catch (error) {
                          console.error("Erro ao gerar PDF:", error)
                        }
                      }}
                      disabled={!selectedParticipant}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Declaração de Orientação */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Declaração de Orientação
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">Declaração de orientação para o orientador.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePreview("orientacao")}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const downloadButtons = document.querySelectorAll('[data-document-type="orientacao"]')
                        if (downloadButtons.length > 0) {
                          ;(downloadButtons[0] as HTMLButtonElement).click()
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* CEAPG Email Section */}
                <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar para CEAPG
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Envie todas as declarações para o CEAPG (Colegiado de Ensino, Pesquisa e Extensão) por email.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="flex items-center gap-2"
                    disabled={sendCeapgMutation.isPending}
                  >
                    <Mail className="h-4 w-4" />
                    Enviar para CEAPG
                  </Button>
                </div>

                <div className="hidden">
                  <PDFGenerator
                    bancaId={parseInt(id)}
                    showParticipantSelection={true}
                    onParticipantSelect={setSelectedParticipant}
                  />
                </div>
              </div>
            </div>

            {/* Coluna da direita - Preview */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Preview do Documento</h3>
                {previewType && <p className="text-sm text-muted-foreground">Visualizando: {previewType}</p>}
              </div>

              <div className="border rounded-lg">
                {previewUrl ? (
                  <iframe src={previewUrl} className="w-full h-[600px] rounded-lg" title="Preview do documento PDF" />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Clique em "Visualizar" para ver o preview do documento</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CEAPG Email Modal */}
      <CeapgEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onConfirm={handleSendCeapgEmail}
        isLoading={sendCeapgMutation.isPending}
        bancaInfo={bancaInfo}
      />
    </div>
  )
}

const DocumentosPageSkeleton = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="bg-card shadow-md rounded-lg overflow-hidden">
          <div className="bg-muted p-6 border-b">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80 mb-6" />
            <div className="bg-muted rounded-lg p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
