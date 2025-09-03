import { StyleSheet } from "@react-pdf/renderer"

export const sharedStyles = StyleSheet.create({
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
  divider: {
    borderBottom: "2 solid #000",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    width: 120,
  },
  underline: {
    fontSize: 12,
    flex: 1,
    borderBottom: "1 solid #000",
    paddingBottom: 2,
    paddingLeft: 5,
  },
})