import type { DocumentInfo } from "@/hooks"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { SharedDocumentHeader } from "./shared-document"

export const DeclaracaoParticipacaoPDF = ({ bancaInfo, membroId }: { bancaInfo: DocumentInfo; membroId: number }) => {
  const { curso, membros } = bancaInfo

  const membro = membros.find((m) => m.id === membroId)
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
        <Page size="A4" style={styles.page}>
          <Text>Membro não encontrado</Text>
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <SharedDocumentHeader curso={curso} />

        {/* Título do Documento */}
        <Text style={styles.documentTitle}>DECLARAÇÃO</Text>

        {/* Texto da Declaração */}
        <Text style={styles.declarationText}>
          Declaro para os devidos fins, que{" "}
          <Text style={styles.boldText}>
            {membro.usuario.academicTitle} {membro.usuario.nome}
          </Text>
          , participou da banca de defesa do Projeto Final II de <Text style={styles.boldText}>{bancaInfo.autor}</Text>{" "}
          aluno do Curso de {curso.nome}
          da UFBA, intitulado <Text style={styles.boldText}>"{bancaInfo.tituloTrabalho}"</Text>, que ocorreu em{" "}
          <Text style={styles.boldText}>{defenseDate}</Text>, atuando como {getRoleText(membro.role)}.
        </Text>

        {/* Local e Data */}
        <Text style={styles.location}>Salvador, {currentDate}.</Text>

        {/* Assinatura */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>Nome do Coordenador</Text>
          <Text style={styles.signatureTitle}>
            Coordenador do Curso de {curso.nome}
            {"\n"}
            UFBA
          </Text>
        </View>
      </Page>
    </Document>
  )
}
export const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 50,
    fontSize: 12,
    fontFamily: "Times-Roman",
    lineHeight: 1.6,
  },
  header: {
    textAlign: "center",
    marginBottom: 50,
  },
  headerLine: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  headerSubline: {
    fontSize: 10,
    marginBottom: 2,
    fontStyle: "italic",
  },
  cep: {
    fontSize: 10,
    marginBottom: 30,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 60,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  declarationText: {
    fontSize: 12,
    textAlign: "justify",
    lineHeight: 2,
    marginBottom: 80,
    textIndent: 50,
  },
  boldText: {
    fontWeight: "bold",
  },
  location: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 80,
  },
  signature: {
    textAlign: "center",
    marginTop: 40,
  },
  signatureLine: {
    borderTop: "1 solid #000",
    width: 300,
    margin: "0 auto",
    marginBottom: 10,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 11,
    lineHeight: 1.2,
  },
})
