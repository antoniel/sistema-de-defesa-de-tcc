import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { BancaInfoForDocument } from "../../services/document.service"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 20,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  institution: {
    fontSize: 12,
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 10,
    textDecoration: "underline",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    width: 120,
  },
  value: {
    flex: 1,
  },
  membersTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottom: "1 solid #ccc",
  },
  memberName: {
    flex: 2,
  },
  memberRole: {
    flex: 1,
  },
  memberNote: {
    flex: 1,
    textAlign: "center",
  },
  signatures: {
    marginTop: 40,
  },
  signatureBlock: {
    marginBottom: 30,
    textAlign: "center",
  },
  signatureLine: {
    borderBottom: "1 solid #000",
    width: 300,
    margin: "0 auto",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 10,
  },
})

interface AtaDefesaPDFProps {
  bancaInfo: BancaInfoForDocument
}

export const AtaDefesaPDF = ({ bancaInfo }: AtaDefesaPDFProps) => {
  const { banca, orientador, aluno, curso, membros } = bancaInfo

  const currentDate = new Date().toLocaleDateString("pt-BR")
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString("pt-BR")

  // Calcular resultado da banca
  const getResultado = () => {
    if (!banca.notaFinal) return "PENDENTE"
    return banca.notaFinal >= 7 ? "APROVADO" : "REPROVADO"
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Universidade Federal do Rio Grande do Norte</Text>
          <Text style={styles.subtitle}>Instituto de Computação</Text>
          <Text style={styles.institution}>
            {curso.nome} ({curso.sigla})
          </Text>
          <Text style={[styles.title, { marginTop: 20 }]}>Ata de Defesa de Trabalho de Conclusão de Curso</Text>
        </View>

        {/* Identificação do Trabalho */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Trabalho</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>{banca.titulo}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Autor:</Text>
            <Text style={styles.value}>{banca.autor}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Matrícula:</Text>
            <Text style={styles.value}>{banca.matricula || "N/A"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Turma:</Text>
            <Text style={styles.value}>{banca.turma}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Período:</Text>
            <Text style={styles.value}>{banca.periodoAcademico}</Text>
          </View>
        </View>

        {/* Informações da Defesa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Defesa</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>{defenseDate}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Local:</Text>
            <Text style={styles.value}>{banca.local}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Modalidade:</Text>
            <Text style={styles.value}>{banca.modalidade === "local" ? "Presencial" : "Remoto"}</Text>
          </View>
        </View>

        {/* Composição da Banca */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Composição da Banca Examinadora</Text>

          <View style={styles.membersTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.memberName}>Nome</Text>
              <Text style={styles.memberRole}>Função</Text>
              <Text style={styles.memberNote}>Nota</Text>
            </View>

            {membros.map((membro, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.memberName}>{membro.nome}</Text>
                <Text style={styles.memberRole}>
                  {membro.role === "orientador"
                    ? "Orientador"
                    : membro.role === "coorientador"
                      ? "Coorientador"
                      : membro.role === "avaliador"
                        ? "Avaliador"
                        : "Discente"}
                </Text>
                <Text style={styles.memberNote}>{membro.nota || "-"}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Resultado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultado da Avaliação</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Nota Final:</Text>
            <Text style={styles.value}>{banca.notaFinal || "Pendente"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Resultado:</Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>{getResultado()}</Text>
          </View>
        </View>

        {/* Assinaturas */}
        <View style={styles.signatures}>
          <Text style={styles.sectionTitle}>Assinaturas</Text>

          {membros.map((membro, index) => (
            <View key={index} style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text>{membro.nome}</Text>
              <Text style={{ fontSize: 9 }}>
                {membro.role === "orientador"
                  ? "Orientador"
                  : membro.role === "coorientador"
                    ? "Coorientador"
                    : membro.role === "avaliador"
                      ? "Avaliador"
                      : "Discente"}
              </Text>
            </View>
          ))}
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>Documento gerado em {currentDate}</Text>
          <Text>Sistema de Gestão de Bancas Acadêmicas - UFRN</Text>
        </View>
      </Page>
    </Document>
  )
}
