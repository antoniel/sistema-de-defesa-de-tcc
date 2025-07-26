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

interface DeclaracaoParticipacaoPDFProps {
  bancaInfo: BancaInfoForDocument
  membroId: number
}

export const DeclaracaoParticipacaoPDF: React.FC<DeclaracaoParticipacaoPDFProps> = ({ 
  bancaInfo, 
  membroId 
}) => {
  const { banca, curso, membros } = bancaInfo
  
  const membro = membros.find(m => m.id === membroId)
  if (!membro) {
    throw new Error('Membro não encontrado na banca')
  }
  
  const currentDate = new Date().toLocaleDateString('pt-BR')
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString('pt-BR')
  
  const getRoleText = (role: string) => {
    switch (role) {
      case 'orientador': return 'Orientador'
      case 'coorientador': return 'Coorientador'
      case 'avaliador': return 'Avaliador'
      case 'discente': return 'Representante Discente'
      default: return 'Membro'
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Universidade Federal do Rio Grande do Norte</Text>
          <Text style={styles.subtitle}>Instituto de Computação</Text>
          <Text style={styles.institution}>{curso.nome} ({curso.sigla})</Text>
          <Text style={[styles.title, { marginTop: 30 }]}>
            Declaração de Participação em Banca Examinadora
          </Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            Declaro, para os devidos fins, que o(a) Professor(a) {' '}
            <Text style={styles.highlight}>{membro.nome}</Text>, {' '}
            {membro.academicTitle} pela {membro.school}, participou como {' '}
            <Text style={styles.highlight}>{getRoleText(membro.role)}</Text> da Banca 
            Examinadora de Trabalho de Conclusão de Curso do discente {' '}
            <Text style={styles.highlight}>{banca.autor}</Text>.
          </Text>

          <Text style={styles.paragraph}>
            O trabalho intitulado "{banca.titulo}" foi defendido no dia {' '}
            <Text style={styles.highlight}>{defenseDate}</Text>, no {banca.local}, 
            na modalidade {banca.modalidade === 'local' ? 'presencial' : 'remota'}.
          </Text>

          <Text style={styles.paragraph}>
            A banca examinadora foi composta pelos seguintes membros:
          </Text>

          {/* Lista da banca */}
          <View style={{ marginLeft: 20, marginBottom: 15 }}>
            {membros.map((m, index) => (
              <Text key={index} style={{ marginBottom: 3 }}>
                • {m.nome} - {getRoleText(m.role)}
                {m.id === membroId ? ' (DECLARANTE)' : ''}
              </Text>
            ))}
          </View>
        </View>

        {/* Detalhes */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Curso:</Text>
            <Text style={styles.value}>{curso.nome}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Período Acadêmico:</Text>
            <Text style={styles.value}>{banca.periodoAcademico}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Matrícula do Aluno:</Text>
            <Text style={styles.value}>{banca.matricula || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Turma:</Text>
            <Text style={styles.value}>{banca.turma}</Text>
          </View>
        </View>

        <Text style={[styles.content, styles.paragraph]}>
          Esta declaração é emitida para comprovar a participação do referido 
          professor na banca examinadora, podendo ser utilizada para fins de 
          pontuação em progressão funcional, relatórios de atividades ou outros 
          fins que se fizerem necessários.
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