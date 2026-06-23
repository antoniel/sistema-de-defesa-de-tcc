import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBancaDocumentInfo } from "@/hooks/documento.hooks"
import { useToast } from "@/hooks/use-toast"
import { pdf } from "@react-pdf/renderer"
import { Download, FileText, Loader2 } from "lucide-react"
import React, { useState } from "react"
import { FormularioAvaliacaoPDF as AtaDefesaPDF } from "@tcc/pdf-components"
import { DeclaracaoOrientacaoPDF } from "@tcc/pdf-components"
import { DeclaracaoParticipacaoPDF } from "@tcc/pdf-components"

interface PDFGeneratorProps {
  bancaId: number
  className?: string
  showParticipantSelection?: boolean
  onParticipantSelect?: (participantId: number | null) => void
}

export function PDFGenerator({ bancaId, className, showParticipantSelection = false, onParticipantSelect }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMembro, setSelectedMembro] = useState<number | null>(null)
  const { data: bancaInfo, isLoading, error } = useBancaDocumentInfo(bancaId)
  const { toast } = useToast()

  // Get eligible participants (exclude students)
  const eligibleParticipants = bancaInfo?.membros.filter(m => m.role !== "aluno") || []

  const handleParticipantSelect = (participantId: string) => {
    const id = participantId ? Number(participantId) : null
    setSelectedMembro(id)
    onParticipantSelect?.(id)
  }

  const generateAndDownloadPDF = async (
    type: "ata" | "participacao" | "orientacao" | "coorientacao",
    membroId?: number,
  ) => {
    if (!bancaInfo) {
      toast({
        title: "Erro",
        description: "Dados da banca não disponíveis",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      let pdfComponent: React.ReactElement
      let fileName: string
      switch (type) {
        case "ata":
          pdfComponent = <AtaDefesaPDF bancaInfo={bancaInfo} />
          fileName = `ata-defesa.pdf`
          break
        case "participacao":
          const participanteId =
            membroId || bancaInfo.membros.find((m) => m.role !== "aluno")?.id || bancaInfo.membros[0]?.id
          if (!participanteId) throw new Error("Membro não encontrado")
          pdfComponent = <DeclaracaoParticipacaoPDF bancaInfo={bancaInfo} membroId={participanteId} />
          fileName = `declaracao-participacao.pdf`
          break
        case "orientacao":
          const orientador = bancaInfo.membros.find((m) => m.role === "orientador")
          if (!orientador) throw new Error("Orientador não encontrado")
          pdfComponent = <DeclaracaoOrientacaoPDF bancaInfo={bancaInfo} orientadorId={orientador.id} />
          fileName = `declaracao-orientacao.pdf`
          break
        case "coorientacao":
          const coorientador = bancaInfo.membros.find((m) => m.role === "coorientador")
          if (!coorientador) throw new Error("Coorientador não encontrado")
          pdfComponent = <DeclaracaoOrientacaoPDF bancaInfo={bancaInfo} orientadorId={coorientador.id} />
          fileName = `declaracao-coorientacao.pdf`
          break
        default:
          throw new Error("Tipo de documento inválido")
      }

      // Gerar PDF
      const blob = await pdf(pdfComponent).toBlob()

      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "PDF gerado e baixado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    )
  }

  if (error) {
    return <div className={`text-sm text-destructive ${className}`}>Erro ao carregar dados da banca</div>
  }

  return (
    <div className={className}>
      {showParticipantSelection && eligibleParticipants.length > 0 && (
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Selecione o participante:</label>
          <Select value={selectedMembro?.toString() || ""} onValueChange={handleParticipantSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha um participante" />
            </SelectTrigger>
            <SelectContent>
              {eligibleParticipants.map((membro) => (
                <SelectItem key={membro.id} value={membro.id.toString()}>
                  {membro.usuario.nome} ({membro.role === "orientador" ? "Orientador" : "Avaliador"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateAndDownloadPDF("ata")}
          disabled={isGenerating}
          className="flex items-center gap-2"
          data-document-type="ata"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Ata de Defesa
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => generateAndDownloadPDF("participacao", selectedMembro || undefined)}
          disabled={isGenerating}
          className="flex items-center gap-2"
          data-document-type="participacao"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Decl. Participação
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => generateAndDownloadPDF("orientacao")}
          disabled={isGenerating}
          className="flex items-center gap-2"
          data-document-type="orientacao"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Decl. Orientação
        </Button>
      </div>
    </div>
  )
}
