import { Document, Page, Text, View } from "@react-pdf/renderer"
import React from "react"
import { SharedDocumentHeader } from "./shared-header"
import { sharedStyles } from "./shared-styles"
import type { DocumentInfo } from "./types"
;(React as any).a = 1 as any

interface DeclaracaoParticipacaoPDFProps {
  bancaInfo: DocumentInfo
  membroId: number
}

export function DeclaracaoParticipacaoPDF({ bancaInfo, membroId }: DeclaracaoParticipacaoPDFProps) {
  const { curso, membros } = bancaInfo
  const membro = membros.find((m) => m.id === membroId)
  const nomeCoordenador = curso.nomeCoordenador?.trim() || "Nome do Coordenador"

  const defenseDate = new Date(bancaInfo.dataRealizacao).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const getRoleText = (role: string) => {
    switch (role) {
      case "orientador":
        return "Orientador"
      case "coorientador":
        return "Coorientador"
      case "avaliador":
        return "membro da banca examinadora"
      case "aluno":
        return "Aluno"
      default:
        return role
    }
  }

  if (!membro) {
    return (
      <Document>
        <Page size="A4" style={sharedStyles.page}>
          <Text>Membro não encontrado</Text>
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <SharedDocumentHeader curso={curso} />
        <Text style={sharedStyles.documentTitle}>DECLARAÇÃO</Text>
        <Text style={sharedStyles.declarationText}>
          Declaro para os devidos fins, que <Text style={sharedStyles.boldText}>{membro.usuario.nome}</Text>, participou
          da banca de defesa do Projeto Final II de <Text style={sharedStyles.boldText}>{bancaInfo.autor}</Text> aluno
          do Curso de {curso.nome} da UFBA, intitulado{" "}
          <Text style={sharedStyles.boldText}>"{bancaInfo.tituloTrabalho}"</Text>, que ocorreu em{" "}
          <Text style={sharedStyles.boldText}>{defenseDate}</Text>, atuando como {getRoleText(membro.role)}.
        </Text>
        <Text style={sharedStyles.location}>Salvador, {currentDate}.</Text>
        <View style={sharedStyles.signature}>
          <View style={sharedStyles.signatureLine} />
          <Text style={sharedStyles.signatureName}>{nomeCoordenador}</Text>
          <Text style={sharedStyles.signatureTitle}>
            Coordenador do Curso de {curso.nome}
            {"\n"}UFBA
          </Text>
        </View>
      </Page>
    </Document>
  )
}
