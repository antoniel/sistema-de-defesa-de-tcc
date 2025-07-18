import { describe, it, expect, beforeEach } from "vitest"
import { generateAtaDefesaHTML } from "../../templates/document/ata-defesa.template"
import { generateDeclaracaoParticipacaoHTML } from "../../templates/document/declaracao-participacao.template"
import { generateDeclaracaoOrientacaoHTML } from "../../templates/document/declaracao-orientacao.template"
import type { BancaInfoForDocument } from "../../services/document.service"

describe("Documento Templates", () => {
  let mockBancaInfo: BancaInfoForDocument

  beforeEach(() => {
    mockBancaInfo = {
      banca: {
        id: 1,
        titulo: "Sistema de Gestão de Bancas Acadêmicas",
        autor: "João Silva",
        matricula: "20200001",
        turma: "2020.1",
        periodoAcademico: "2024.1",
        dataRealizacao: "2024-07-18",
        local: "Sala 101",
        modalidade: "local",
        resumo: "Este trabalho apresenta um sistema completo para gestão de bancas acadêmicas...",
        abstract: "This work presents a complete system for academic committee management...",
        palavrasChave: "bancas, gestão, sistemas, web",
        notaFinal: 9.5,
        visible: true,
      },
      orientador: {
        id: 2,
        nome: "Dr. Maria Santos",
        email: "maria.santos@ufrn.br",
        matricula: "123456",
        academicTitle: "Doutorado",
        school: "Instituto de Computação",
      },
      aluno: {
        id: 3,
        nome: "João Silva",
        email: "joao.silva@ufrn.br",
        matricula: "20200001",
        academicTitle: "Graduação",
        school: "Instituto de Computação",
      },
      curso: {
        id: 1,
        nome: "Bacharelado em Ciência da Computação",
        sigla: "BCC",
      },
      membros: [
        {
          id: 2,
          nome: "Dr. Maria Santos",
          email: "maria.santos@ufrn.br",
          matricula: "123456",
          academicTitle: "Doutorado",
          school: "Instituto de Computação",
          role: "orientador",
          nota: 9.5,
        },
        {
          id: 4,
          nome: "Dr. Carlos Pereira",
          email: "carlos.pereira@ufrn.br",
          matricula: "123457",
          academicTitle: "Doutorado",
          school: "Instituto de Computação",
          role: "avaliador",
          nota: 9.0,
        },
        {
          id: 5,
          nome: "Dr. Ana Costa",
          email: "ana.costa@ufrn.br",
          matricula: "123458",
          academicTitle: "Doutorado",
          school: "Instituto de Computação",
          role: "avaliador",
          nota: 10.0,
        },
      ],
    }
  })

  it("deve gerar HTML da ata de defesa", () => {
    const html = generateAtaDefesaHTML(mockBancaInfo)
    
    expect(html).toContain("Ata de Defesa de Trabalho de Conclusão de Curso")
    expect(html).toContain("Sistema de Gestão de Bancas Acadêmicas")
    expect(html).toContain("João Silva")
    expect(html).toContain("Dr. Maria Santos")
    expect(html).toContain("Bacharelado em Ciência da Computação")
    expect(html).toContain("9.5")
    expect(html).toContain("APROVADO")
  })

  it("deve gerar HTML da declaração de participação", () => {
    const membroId = 4 // Dr. Carlos Pereira
    const html = generateDeclaracaoParticipacaoHTML(mockBancaInfo, membroId)
    
    expect(html).toContain("Declaração de Participação em Banca Examinadora")
    expect(html).toContain("Dr. Carlos Pereira")
    expect(html).toContain("Avaliador")
    expect(html).toContain("Sistema de Gestão de Bancas Acadêmicas")
    expect(html).toContain("João Silva")
  })

  it("deve gerar HTML da declaração de orientação", () => {
    const orientadorId = 2 // Dr. Maria Santos
    const html = generateDeclaracaoOrientacaoHTML(mockBancaInfo, orientadorId)
    
    expect(html).toContain("Declaração de Orientação")
    expect(html).toContain("Dr. Maria Santos")
    expect(html).toContain("Orientador")
    expect(html).toContain("Sistema de Gestão de Bancas Acadêmicas")
    expect(html).toContain("João Silva")
  })

  it("deve lançar erro se membro não encontrado na declaração de participação", () => {
    expect(() => {
      generateDeclaracaoParticipacaoHTML(mockBancaInfo, 999)
    }).toThrow("Membro não encontrado na banca")
  })

  it("deve lançar erro se orientador não encontrado na declaração de orientação", () => {
    expect(() => {
      generateDeclaracaoOrientacaoHTML(mockBancaInfo, 999)
    }).toThrow("Orientador não encontrado na banca")
  })
})