import React, { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useBancaDocumentInfo } from '@/hooks/documento.hooks'
import { AtaDefesaPDF, type BancaInfoForDocument } from './ata-defesa'
import { useToast } from '@/hooks/use-toast'

interface PDFGeneratorProps {
  bancaId: number
  className?: string
}

export function PDFGenerator({ bancaId, className }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { data: bancaInfo, isLoading, error } = useBancaDocumentInfo(bancaId)
  const { toast } = useToast()

  const generateAndDownloadPDF = async (type: 'ata' | 'participacao' | 'orientacao') => {
    if (!bancaInfo) {
      toast({
        title: 'Erro',
        description: 'Dados da banca não disponíveis',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      let pdfComponent: React.ReactElement
      let fileName: string

      switch (type) {
        case 'ata':
          pdfComponent = <AtaDefesaPDF bancaInfo={bancaInfo as any} />
          fileName = `ata-defesa-${bancaInfo.banca.id}.pdf`
          break
        case 'participacao':
          // TODO: Implementar DeclaracaoParticipacaoPDF
          pdfComponent = <AtaDefesaPDF bancaInfo={bancaInfo as any} />
          fileName = `declaracao-participacao-${bancaInfo.banca.id}.pdf`
          break
        case 'orientacao':
          // TODO: Implementar DeclaracaoOrientacaoPDF
          pdfComponent = <AtaDefesaPDF bancaInfo={bancaInfo as any} />
          fileName = `declaracao-orientacao-${bancaInfo.banca.id}.pdf`
          break
        default:
          throw new Error('Tipo de documento inválido')
      }

      // Gerar PDF
      const blob = await pdf(pdfComponent).toBlob()

      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Sucesso',
        description: 'PDF gerado e baixado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF. Tente novamente.',
        variant: 'destructive',
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
    return (
      <div className={`text-sm text-destructive ${className}`}>
        Erro ao carregar dados da banca
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => generateAndDownloadPDF('ata')}
        disabled={isGenerating}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Ata de Defesa
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => generateAndDownloadPDF('participacao')}
        disabled={isGenerating}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Decl. Participação
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => generateAndDownloadPDF('orientacao')}
        disabled={isGenerating}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Decl. Orientação
      </Button>
    </div>
  )
}