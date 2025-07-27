import type { DocumentInfo } from "@/hooks/documento.hooks"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

export const AtaDefesaPDF = ({ bancaInfo }: { bancaInfo: DocumentInfo }) => {
  const currentDate = new Date().toLocaleDateString("pt-BR")
  const defenseDate = new Date(bancaInfo.dataRealizacao).toLocaleDateString("pt-BR")

  const getResultado = () => {
    if (!bancaInfo.notaFinal) return "PENDENTE"
    return Number(bancaInfo.notaFinal) >= 7 ? "APROVADO" : "REPROVADO"
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "orientador":
        return "Orientador"
      case "coorientador":
        return "Coorientador"
      case "avaliador":
        return "Avaliador"
      case "aluno":
        return "Aluno"
      default:
        return role
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerLine}>Ministério da Educação</Text>
          <Text style={styles.headerLine}>Universidade Federal da Bahia</Text>
          <Text style={styles.headerLine}>Instituto de Computação</Text>
          <Text style={styles.headerLine}>Colegiado do Curso de {bancaInfo.curso.nome}</Text>
          <Text style={styles.headerSubline}>
            Av. Adhemar de Barros s/n - Campus Universitário de Ondina, Ondina - Salvador-Bahia
          </Text>
          <Text style={styles.cep}>CEP 40170-110 Tel: (071) 3283-6337 / 6336</Text>
        </View>

        {/* Título do Documento */}
        <Text style={styles.documentTitle}>Ata de Defesa de Trabalho de Conclusão de Curso</Text>

        {/* Identificação do Trabalho */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Trabalho</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>{bancaInfo.tituloTrabalho}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Autor:</Text>
            <Text style={styles.value}>{bancaInfo.autor}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Matrícula:</Text>
            <Text style={styles.value}>{bancaInfo.matricula || "N/A"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Turma:</Text>
            <Text style={styles.value}>{bancaInfo.turma}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Período:</Text>
            <Text style={styles.value}>{bancaInfo.periodoAcademico}</Text>
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
            <Text style={styles.value}>{bancaInfo.local}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Modalidade:</Text>
            <Text style={styles.value}>{bancaInfo.modalidade === "local" ? "Presencial" : "Remoto"}</Text>
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

            {bancaInfo.membros.map((membro, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.memberName}>{membro.usuario.nome}</Text>
                <Text style={styles.memberRole}>{getRoleText(membro.role)}</Text>
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
            <Text style={styles.value}>{bancaInfo.notaFinal || "Pendente"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Resultado:</Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>{getResultado()}</Text>
          </View>
        </View>

        {/* Assinaturas */}
        <View style={styles.signatures}>
          <Text style={styles.sectionTitle}>Assinaturas</Text>

          {bancaInfo.membros.map((membro, index) => (
            <View key={index} style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text>{membro.usuario.nome}</Text>
              <Text style={{ fontSize: 9 }}>{getRoleText(membro.role)}</Text>
            </View>
          ))}
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>Documento gerado em {currentDate}</Text>
          <Text>Sistema de Gestão de Bancas Acadêmicas - UFBA</Text>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 50,
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  headerLine: {
    fontSize: 13,
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
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
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
    fontSize: 11,
  },
  value: {
    flex: 1,
    fontSize: 11,
  },
  membersTable: {
    marginTop: 10,
    border: "1 solid #000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 8,
    fontWeight: "bold",
    borderBottom: "1 solid #000",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1 solid #ccc",
  },
  memberName: {
    flex: 3,
    fontSize: 10,
  },
  memberRole: {
    flex: 2,
    fontSize: 10,
  },
  memberNote: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
  },
  signatures: {
    marginTop: 40,
    pageBreakInside: "avoid",
  },
  signatureBlock: {
    marginBottom: 40,
    textAlign: "center",
  },
  signatureLine: {
    borderTop: "1 solid #000",
    width: 250,
    margin: "0 auto",
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  signatureTitle: {
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9,
    borderTop: "1 solid #ccc",
    paddingTop: 10,
  },
})
