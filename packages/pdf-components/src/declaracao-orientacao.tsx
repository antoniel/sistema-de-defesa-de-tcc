import { Document, Page, Text, View } from "@react-pdf/renderer"
import React from "react"
import { SharedDocumentHeader } from "./shared-header"
import { sharedStyles } from "./shared-styles"
import type { DocumentInfo } from "./types"
;(React as any).a = 1 as any

interface DeclaracaoOrientacaoPDFProps {
  bancaInfo: DocumentInfo
  orientadorId: number
}

export function DeclaracaoOrientacaoPDF({ bancaInfo, orientadorId }: DeclaracaoOrientacaoPDFProps) {
  const { curso, membros } = bancaInfo
  const orientador = membros.find(
    (m) => m.id === orientadorId && (m.role === "orientador" || m.role === "coorientador")
  )

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
        return "orientador"
      case "coorientador":
        return "coorientador"
      default:
        return role
    }
  }

  if (!orientador) {
    return (
      <Document>
        <Page size="A4" style={sharedStyles.page}>
          <Text>Orientador não encontrado</Text>
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
          Declaro para os devidos fins, que <Text style={sharedStyles.boldText}>{orientador.usuario.nome}</Text> atuou
          como {getRoleText(orientador.role)} do Projeto Final II de{" "}
          <Text style={sharedStyles.boldText}>{bancaInfo.autor}</Text>, aluno do Curso de {curso.nome} da UFBA,
          intitulado <Text style={sharedStyles.boldText}>"{bancaInfo.tituloTrabalho}"</Text>, cuja defesa ocorreu em{" "}
          <Text style={sharedStyles.boldText}>{defenseDate}</Text>.
        </Text>
        <Text style={sharedStyles.location}>Salvador, {currentDate}.</Text>
        <View style={sharedStyles.signature}>
          <View style={sharedStyles.signatureLine} />
          <Text style={sharedStyles.signatureName}>Nome do Coordenador</Text>
          <Text style={sharedStyles.signatureTitle}>
            Coordenador do Curso de {curso.nome}
            {"\n"}UFBA
          </Text>
        </View>
      </Page>
    </Document>
  )
}
