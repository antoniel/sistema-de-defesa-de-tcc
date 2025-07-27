import { StyleSheet, Text, View } from "@react-pdf/renderer"

export const SharedDocumentHeader = ({ curso }: { curso: { nome: string } }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLine}>Ministério da Educação</Text>
      <Text style={styles.headerLine}>Universidade Federal da Bahia</Text>
      <Text style={styles.headerLine}>Instituto de Computação</Text>
      <Text style={styles.headerLine}>Colegiado do Curso de {curso.nome}</Text>
      <Text style={styles.headerSubline}>
        Av. Adhemar de Barros s/n - Campus Universitário de Ondina, Ondina - Salvador-Bahia
      </Text>
      <Text style={styles.cep}>CEP 40170-110 Tel: (071) 3283-6337 / 6336</Text>
    </View>
  )
}

const styles = StyleSheet.create({
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
