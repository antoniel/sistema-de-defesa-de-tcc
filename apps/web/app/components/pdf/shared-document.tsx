import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

export const SharedDocumentHeader = ({ curso }: { curso: { nome: string } }) => {
  return (
    <View style={styles.header}>
      <Image src="/brasao_ufba.png" style={styles.brasao} />
      <View style={styles.headerText}>
        <Text style={styles.headerLine}>Ministério da Educação</Text>
        <Text style={styles.headerLine}>Universidade Federal da Bahia</Text>
        <Text style={styles.headerLine}>Instituto de Computação</Text>
        <Text style={styles.headerLine}>Colegiado do Curso de {curso.nome}</Text>
        <Text style={styles.headerSubline}>
          Avenida Milton Santos, s/n - Campus de Ondina, CEP: 40.170-110 Salvador-Bahia
        </Text>
        <Text style={styles.cep}>CEP 40170-110 Tel: (071) 3283-6337 / 6336</Text>
      </View>
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
    marginBottom: 50,
    position: "relative",
  },
  brasao: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  headerText: {
    textAlign: "center",
    width: "100%",
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
