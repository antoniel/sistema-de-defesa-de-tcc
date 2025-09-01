import { fileAvaliadores } from "@/hooks/documento.hooks"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DocumentInfo } from "./types"

interface FormularioAvaliacaoPDFProps {
  bancaInfo: DocumentInfo
}

export function FormularioAvaliacaoPDF({ bancaInfo }: FormularioAvaliacaoPDFProps) {
  const defenseDate = new Date(bancaInfo.dataRealizacao).toLocaleDateString("pt-BR")
  const orientador = bancaInfo.membros.find((m) => m.role === "orientador")
  const coorientador = bancaInfo.membros.find((m) => m.role === "coorientador")
  const avaliadores = fileAvaliadores(bancaInfo.membros) || []

  const notasValidas = avaliadores.filter((a) => a.nota).map((a) => Number(a.nota))
  const media =
    notasValidas.length > 0 ? (notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length).toFixed(1) : ""

  const curso = bancaInfo.curso?.nome || ""

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerLine}>Universidade Federal da Bahia</Text>
          <Text style={styles.headerLine}>Departamento de Ciência da Computação</Text>
          <Text style={styles.headerLine}>Bacharelado em {curso}</Text>
          <Text style={styles.headerLine}>MATC98 - TCC BACHARELADO {curso.toUpperCase()}</Text>
          <Text style={styles.headerLine}>
            TURMA: 010100 DATA: {defenseDate} - SEMESTRE: {bancaInfo.periodoAcademico}
          </Text>
        </View>

        {/* Linha divisória */}
        <View style={styles.divider} />

        {/* Título */}
        <Text style={styles.title}>Formulário de Avaliação</Text>

        {/* Informações do trabalho */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Aluno(a):</Text>
            <Text style={styles.underline}>{bancaInfo.autor}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Título do Trabalho:</Text>
            <Text style={styles.underline}>{bancaInfo.tituloTrabalho}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Orientador(a):</Text>
            <Text style={styles.underline}>{orientador?.usuario.nome || ""}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Co-orientador(a):</Text>
            <Text style={styles.underline}>{coorientador?.usuario.nome || ""}</Text>
          </View>
        </View>

        {/* Banca Examinadora */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Banca Examinadora</Text>
          </View>
          <View style={styles.tableSubHeader}>
            <Text style={styles.tableSubTitle}>Nome</Text>
          </View>

          {avaliadores.map((avaliador, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.evaluatorLabel}>Avaliador {index + 1}</Text>
              <Text style={styles.evaluatorName}>{avaliador.usuario.nome}</Text>
            </View>
          ))}
        </View>

        {/* Avaliação */}
        <View style={styles.evaluationSection}>
          <View style={styles.evaluationHeader}>
            <Text style={styles.evaluationTitle}>Avaliação</Text>
          </View>

          <View style={styles.evaluationTable}>
            <View style={styles.evaluationRow}>
              <Text style={styles.dateLabel}>Data: {defenseDate}</Text>
              <Text style={styles.gradeHeader}>Nota(*)</Text>
              <Text style={styles.signatureHeader}>Assinatura</Text>
            </View>

            {avaliadores.map((avaliador, index) => (
              <View key={index} style={styles.evaluationRow}>
                <Text style={styles.evaluatorCell}>Avaliador {index + 1}</Text>
                <Text style={styles.gradeCell}>{avaliador.nota || ""}</Text>
                <Text style={styles.signatureCell}></Text>
              </View>
            ))}

            <View style={styles.evaluationRow}>
              <Text style={styles.evaluatorCell}>Média</Text>
              <Text style={styles.gradeCell}>{media}</Text>
              <Text style={styles.signatureCell}></Text>
            </View>
          </View>
        </View>

        {/* Recebimento da Declaração */}
        <View style={styles.declarationSection}>
          <Text style={styles.declarationTitle}>
            Recebimento da Declaração como Orientador e membro da Banca Examinadora
          </Text>

          <View style={styles.declarationTable}>
            <View style={styles.declarationRow}>
              <Text style={styles.declarationCell}>Orientador</Text>
              <Text style={styles.declarationSignature}></Text>
            </View>
            <View style={styles.declarationRow}>
              <Text style={styles.declarationCell}>Co-orientador</Text>
              <Text style={styles.declarationSignature}></Text>
            </View>
            <View style={styles.declarationRow}>
              <Text style={styles.declarationCell}>Avaliador</Text>
              <Text style={styles.declarationNumbered}>1.</Text>
              <Text style={styles.declarationNumbered}>2.</Text>
              <Text style={styles.declarationNumbered}>3.</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontSize: 11,
    fontFamily: "Times-Roman",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  headerLine: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  divider: {
    borderTop: "1 solid #000",
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    width: 120,
    fontSize: 11,
  },
  underline: {
    flex: 1,
    borderBottom: "1 solid #000",
    paddingBottom: 2,
    fontSize: 11,
  },
  tableSection: {
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    border: "1 solid #000",
    padding: 5,
    textAlign: "center",
  },
  tableTitle: {
    fontWeight: "bold",
    fontSize: 11,
  },
  tableSubHeader: {
    backgroundColor: "#f0f0f0",
    border: "1 solid #000",
    borderTop: "0",
    padding: 5,
    textAlign: "center",
  },
  tableSubTitle: {
    fontWeight: "bold",
    fontSize: 11,
  },
  tableRow: {
    flexDirection: "row",
    border: "1 solid #000",
    borderTop: "0",
  },
  evaluatorLabel: {
    width: 80,
    padding: 5,
    fontWeight: "bold",
    fontSize: 11,
    backgroundColor: "#f0f0f0",
    borderRight: "1 solid #000",
  },
  evaluatorName: {
    flex: 1,
    padding: 5,
    fontSize: 11,
  },
  evaluationSection: {
    marginBottom: 20,
  },
  evaluationHeader: {
    backgroundColor: "#f0f0f0",
    border: "1 solid #000",
    padding: 5,
    textAlign: "center",
  },
  evaluationTitle: {
    fontWeight: "bold",
    fontSize: 11,
  },
  evaluationTable: {
    border: "1 solid #000",
    borderTop: "0",
  },
  evaluationRow: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
  },
  dateLabel: {
    width: 60,
    padding: 5,
    fontWeight: "bold",
    fontSize: 11,
    borderRight: "1 solid #000",
  },
  gradeHeader: {
    width: 80,
    padding: 5,
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    borderRight: "1 solid #000",
  },
  signatureHeader: {
    flex: 1,
    padding: 5,
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
  },
  evaluatorCell: {
    width: 60,
    padding: 5,
    fontSize: 11,
    borderRight: "1 solid #000",
  },
  gradeCell: {
    width: 80,
    padding: 5,
    fontSize: 11,
    textAlign: "center",
    borderRight: "1 solid #000",
  },
  signatureCell: {
    flex: 1,
    padding: 5,
    fontSize: 11,
  },
  observationsLabel: {
    fontWeight: "bold",
    fontSize: 11,
    marginTop: 10,
    marginBottom: 5,
  },
  observationLines: {
    marginBottom: 10,
  },
  observationLine: {
    borderBottom: "1 solid #000",
    marginBottom: 8,
    height: 12,
  },
  observationsText: {
    fontSize: 11,
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 1.4,
  },
  footnote: {
    fontSize: 9,
    fontStyle: "italic",
  },
  declarationSection: {
    marginTop: 20,
  },
  declarationTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 10,
  },
  declarationTable: {
    border: "1 solid #000",
  },
  declarationRow: {
    flexDirection: "row",
    borderBottom: "1 solid #000",
  },
  declarationCell: {
    width: 100,
    padding: 8,
    fontSize: 11,
    fontWeight: "bold",
    borderRight: "1 solid #000",
  },
  declarationSignature: {
    flex: 1,
    padding: 8,
    fontSize: 11,
  },
  declarationNumbered: {
    flex: 1,
    padding: 8,
    fontSize: 11,
    textAlign: "center",
    borderRight: "1 solid #000",
  },
})
