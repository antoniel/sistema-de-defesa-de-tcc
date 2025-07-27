import { Header } from "@/components/layout/Header"
import { BancaNavigation } from "@/components/layout/BancaNavigation"
import { BancaHeader } from "@/components/layout/BancaHeader"
import { AtaDefesaPDF } from "@/components/pdf/ata-defesa"
import { DeclaracaoOrientacaoPDF } from "@/components/pdf/declaracao-orientacao"
import { DeclaracaoParticipacaoPDF } from "@/components/pdf/declaracao-participacao"
import { PDFGenerator } from "@/components/pdf/pdf-generator"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useBanca } from "@/hooks"
import { useBancaDocumentInfo } from "@/hooks/documento.hooks"
import { useUser } from "@/services/useUser"
import { pdf } from "@react-pdf/renderer"
import { ArrowLeft, Download, Eye, FileText } from "lucide-react"
import React, { useState } from "react"
import { useNavigate, useParams } from "react-router"
import type { Route } from "./+types/banca.$id_.documentos"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Documentos da Banca" }]

export default function BancaDocumentosPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)

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

  const isLoading = bancaQuery.isLoading || userQuery.isLoading
  const error = bancaQuery.error || userQuery.error

  const generatePreview = async (type: "ata" | "participacao" | "orientacao", membroId?: number) => {
    if (!bancaInfo) return

    try {
      let pdfComponent: React.ReactElement
      let docName: string

      switch (type) {
        case "ata":
          pdfComponent = <AtaDefesaPDF bancaInfo={bancaInfo} />
          docName = "Ata de Defesa"
          break
        case "participacao":
          const participanteId =
            membroId || bancaInfo.membros.find((m) => m.role !== "aluno")?.id || bancaInfo.membros[0]?.id
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
                    Ata de Defesa
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Documento oficial com o registro da defesa da tese/dissertação.
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
                      onClick={() => {
                        const downloadButtons = document.querySelectorAll('[data-document-type="ata"]')
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

                {/* Declaração de Participação */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Declaração de Participação
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">Declaração para membros da banca examinadora.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePreview("participacao")}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const downloadButtons = document.querySelectorAll('[data-document-type="participacao"]')
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

                <div className="hidden">
                  <PDFGenerator bancaId={parseInt(id)} />
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
