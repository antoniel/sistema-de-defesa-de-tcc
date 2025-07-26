import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { BancaInfoForDocument } from '../../services/document.service'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  institution: {
    fontSize: 13,
    marginBottom: 3,
  },
  content: {
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 15,
  },
  highlight: {
    fontWeight: 'bold',
  },
  details: {
    marginTop: 30,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 140,
  },
  value: {
    flex: 1,
  },
  signature: {
    marginTop: 60,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '1 solid #000',
    width: 400,
    margin: '0 auto',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
  },
})

interface DeclaracaoOrientacaoPDFProps {
  bancaInfo: BancaInfoForDocument
  orientadorId: number
}

export const DeclaracaoOrientacaoPDF: React.FC<DeclaracaoOrientacaoPDFProps> = ({ 
  bancaInfo, 
  orientadorId 
}) => {
  const { banca, curso, membros } = bancaInfo
  
  const orientador = membros.find(m => m.id === orientadorId && 
    (m.role === 'orientador' || m.role === 'coorientador'))
  
  if (!orientador) {
    throw new Error('Orientador não encontrado na banca')
  }
  
  const currentDate = new Date().toLocaleDateString('pt-BR')
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString('pt-BR')
  
  const isOrientador = orientador.role === 'orientador'
  const tipoOrientacao = isOrientador ? 'orientação' : 'coorientação'
  const funcao = isOrientador ? 'Orientador' : 'Coorientador'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Universidade Federal do Rio Grande do Norte</Text>
          <Text style={styles.subtitle}>Instituto de Computação</Text>
          <Text style={styles.institution}>{curso.nome} ({curso.sigla})</Text>
          <Text style={[styles.title, { marginTop: 30 }]}>
            Declaração de {isOrientador ? 'Orientação' : 'Coorientação'}
          </Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            Declaro, para os devidos fins, que o(a) Professor(a) {' '}
            <Text style={styles.highlight}>{orientador.nome}</Text>, {' '}
            {orientador.academicTitle} pela {orientador.school}, exerceu a função de {' '}
            <Text style={styles.highlight}>{funcao}</Text> do Trabalho de Conclusão 
            de Curso do discente <Text style={styles.highlight}>{banca.autor}</Text>.
          </Text>

          <Text style={styles.paragraph}>
            O trabalho intitulado "{banca.titulo}" foi desenvolvido sob sua {tipoOrientacao} 
            e defendido no dia <Text style={styles.highlight}>{defenseDate}</Text>, 
            no {banca.local}, na modalidade {banca.modalidade === 'local' ? 'presencial' : 'remota'}.
          </Text>

          {banca.resumo && (
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>Resumo do trabalho:</Text> {banca.resumo}
            </Text>
          )}

          {banca.palavrasChave && (
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>Palavras-chave:</Text> {banca.palavrasChave}
            </Text>
          )}
        </View>

        {/* Detalhes */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Orientando:</Text>
            <Text style={styles.value}>{banca.autor}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Matrícula:</Text>
            <Text style={styles.value}>{banca.matricula || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Curso:</Text>
            <Text style={styles.value}>{curso.nome}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Período Acadêmico:</Text>
            <Text style={styles.value}>{banca.periodoAcademico}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Turma:</Text>
            <Text style={styles.value}>{banca.turma}</Text>
          </View>
          
          {banca.notaFinal && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Nota Final:</Text>
              <Text style={styles.value}>{banca.notaFinal}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.content, styles.paragraph]}>
          Esta declaração é emitida para comprovar a atividade de {tipoOrientacao} 
          exercida pelo referido professor, podendo ser utilizada para fins de 
          pontuação em progressão funcional, relatórios de atividades acadêmicas 
          ou outros fins que se fizerem necessários.
        </Text>

        {/* Assinatura */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text>Coordenação do Curso</Text>
          <Text style={{ fontSize: 10, marginTop: 5 }}>
            {curso.nome}
          </Text>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text>Natal/RN, {currentDate}</Text>
          <Text>Documento gerado automaticamente pelo Sistema de Gestão de Bancas Acadêmicas</Text>
        </View>
      </Page>
    </Document>
  )
}