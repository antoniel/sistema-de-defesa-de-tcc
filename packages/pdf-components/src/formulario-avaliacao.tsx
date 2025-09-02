import { Document, Page, Text, View } from "@react-pdf/renderer"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react"
import type { DocumentInfo } from "./types"
import { sharedStyles } from "./shared-styles"

interface FormularioAvaliacaoPDFProps {
  bancaInfo: DocumentInfo
}

export function FormularioAvaliacaoPDF({ bancaInfo }: FormularioAvaliacaoPDFProps) {
  const defenseDate = new Date(bancaInfo.dataRealizacao).toLocaleDateString("pt-BR")
  const orientador = bancaInfo.membros.find((m) => m.role === "orientador")
  const coorientador = bancaInfo.membros.find((m) => m.role === "coorientador")
  const avaliadores = bancaInfo.membros.filter((m) => m.role !== "aluno")
  
  const notasValidas = avaliadores.filter((a) => a.nota).map((a) => Number(a.nota))
  const media = notasValidas.length > 0 ? (notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length).toFixed(1) : ""

  return (
    <Document>
      <Page size="A4" style={sharedStyles.page}>
        <View style={sharedStyles.header}>
          <Text style={sharedStyles.headerLine}>Universidade Federal da Bahia</Text>
          <Text style={sharedStyles.headerLine}>Departamento de Ciência da Computação</Text>
          <Text style={sharedStyles.headerLine}>Bacharelado em Sistemas de Informação</Text>
          <Text style={sharedStyles.headerLine}>MATC98 - TCC BACHARELADO SISTEMAS DE INFORMAÇÃO II</Text>
          <Text style={sharedStyles.headerLine}>
            TURMA: 010100 DATA: {defenseDate} - SEMESTRE: {bancaInfo.periodoAcademico}
          </Text>
        </View>
        
        <View style={sharedStyles.divider} />
        <Text style={sharedStyles.title}>Formulário de Avaliação</Text>
        
        <View style={sharedStyles.section}>
          <View style={sharedStyles.row}>
            <Text style={sharedStyles.label}>Aluno(a):</Text>
            <Text style={sharedStyles.underline}>{bancaInfo.autor}</Text>
          </View>
          <View style={sharedStyles.row}>
            <Text style={sharedStyles.label}>Título do Trabalho:</Text>
            <Text style={sharedStyles.underline}>{bancaInfo.tituloTrabalho}</Text>
          </View>
          <View style={sharedStyles.row}>
            <Text style={sharedStyles.label}>Orientador(a):</Text>
            <Text style={sharedStyles.underline}>{orientador?.usuario.nome || "N/A"}</Text>
          </View>
          {coorientador && (
            <View style={sharedStyles.row}>
              <Text style={sharedStyles.label}>Coorientador(a):</Text>
              <Text style={sharedStyles.underline}>{coorientador.usuario.nome}</Text>
            </View>
          )}
          <View style={sharedStyles.row}>
            <Text style={sharedStyles.label}>Média Final:</Text>
            <Text style={sharedStyles.underline}>{media}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}