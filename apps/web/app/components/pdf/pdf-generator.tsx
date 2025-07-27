import { Button } from "@/components/ui/button"
import { useBancaDocumentInfo } from "@/hooks/documento.hooks"
import { useToast } from "@/hooks/use-toast"
import { pdf } from "@react-pdf/renderer"
import { Download, FileText, Loader2 } from "lucide-react"
import React, { useState } from "react"
import { AtaDefesaPDF } from "./ata-defesa"
import { DeclaracaoOrientacaoPDF } from "./declaracao-orientacao"
import { DeclaracaoParticipacaoPDF } from "./declaracao-participacao"

interface PDFGeneratorProps {
  bancaId: number
  className?: string
}

export function PDFGenerator({ bancaId, className }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMembro, setSelectedMembro] = useState<number | null>(null)
  const { data: bancaInfo, isLoading, error } = useBancaDocumentInfo(bancaId)
  const { toast } = useToast()

  const generateAndDownloadPDF = async (type: "ata" | "participacao" | "orientacao", membroId?: number) => {
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
    <div className={`flex flex-wrap gap-2 ${className}`}>
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
        onClick={() => generateAndDownloadPDF("participacao")}
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
  )
}
