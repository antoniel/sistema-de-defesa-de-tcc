import { baseDocumentTemplate } from "./base.template"
import type { BancaInfoForDocument } from "../../services/document.service"

export const generateDeclaracaoParticipacaoHTML = (
  bancaInfo: BancaInfoForDocument, 
  membroId: number
): string => {
  const { banca, orientador, aluno, curso, membros } = bancaInfo
  
  // Encontrar o membro específico
  const membro = membros.find(m => m.id === membroId)
  if (!membro) {
    throw new Error("Membro não encontrado na banca")
  }
  
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('pt-BR')
  const formattedTime = currentDate.toLocaleTimeString('pt-BR')
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString('pt-BR')
  
  const content = `
    <div class="header">
        <h1>Universidade Federal do Rio Grande do Norte</h1>
        <h2>Instituto de Computação</h2>
        <p>${curso.nome} (${curso.sigla})</p>
        <div class="mt-20">
            <h1>Declaração de Participação em Banca Examinadora</h1>
        </div>
    </div>

    <div class="content">
        <div class="section text-center mt-30">
            <h3>DECLARAÇÃO</h3>
        </div>

        <div class="section mt-30">
            <p class="text-left" style="text-indent: 2em; text-align: justify;">
                Declaro, para os devidos fins, que o(a) Professor(a) 
                <strong>${membro.nome}</strong>, portador(a) da matrícula 
                <strong>${membro.matricula}</strong>, com titulação de 
                <strong>${membro.academicTitle}</strong>, vinculado(a) ao(à) 
                <strong>${membro.school}</strong>, participou como 
                <strong>${getRoleName(membro.role)}</strong> da banca examinadora 
                do Trabalho de Conclusão de Curso intitulado 
                <strong>"${banca.titulo}"</strong>, de autoria do(a) discente 
                <strong>${banca.autor}</strong>, matrícula 
                <strong>${banca.matricula || 'N/A'}</strong>, do curso de 
                <strong>${curso.nome}</strong>.
            </p>
        </div>

        <div class="section mt-20">
            <div class="info-row">
                <span class="info-label">Data da Defesa:</span>
                <span class="info-value">${defenseDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Local:</span>
                <span class="info-value">${banca.local}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Modalidade:</span>
                <span class="info-value">${banca.modalidade === 'remoto' ? 'Remoto' : 'Presencial'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Período Acadêmico:</span>
                <span class="info-value">${banca.periodoAcademico}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Turma:</span>
                <span class="info-value">${banca.turma}</span>
            </div>
        </div>

        <div class="section mt-30">
            <h3>Composição da Banca Examinadora</h3>
            
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Função</th>
                        <th>Titulação</th>
                        <th>Instituição</th>
                    </tr>
                </thead>
                <tbody>
                    ${membros.map(m => `
                        <tr ${m.id === membroId ? 'style="background-color: #f0f8ff; font-weight: bold;"' : ''}>
                            <td>${m.nome}</td>
                            <td>${getRoleName(m.role)}</td>
                            <td>${m.academicTitle}</td>
                            <td>${m.school}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section mt-30">
            <p class="text-left" style="text-align: justify;">
                Esta declaração é emitida para comprovação da participação do(a) referido(a) 
                professor(a) em atividades de avaliação acadêmica, podendo ser utilizada para 
                fins de progressão funcional, relatórios de atividades docentes, ou outros 
                fins que se fizerem necessários.
            </p>
        </div>

        <div class="section mt-30">
            <p class="text-left" style="text-align: justify;">
                Declaro ainda que a participação do(a) professor(a) foi fundamental para a 
                qualidade da avaliação do trabalho apresentado, contribuindo para a formação 
                acadêmica do(a) discente e para o aprimoramento do curso de ${curso.nome}.
            </p>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">
                ${orientador.nome}<br>
                Orientador(a) - ${orientador.academicTitle}<br>
                ${orientador.school}<br>
                Matrícula: ${orientador.matricula}
            </div>
        </div>

        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">
                Coordenação do Curso de ${curso.nome}<br>
                ${curso.sigla} - ${curso.nome}
            </div>
        </div>
    </div>

    <div class="mt-30 text-center">
        <p style="font-size: 10pt; color: #666;">
            <strong>Natal/RN, ${formattedDate}</strong>
        </p>
    </div>
  `

  return baseDocumentTemplate
    .replace('{{title}}', 'Declaração de Participação - ' + membro.nome)
    .replace('{{content}}', content)
    .replace('{{date}}', formattedDate)
    .replace('{{time}}', formattedTime)
}

function getRoleName(role: string): string {
  switch (role) {
    case 'orientador':
      return 'Orientador'
    case 'coorientador':
      return 'Coorientador'
    case 'avaliador':
      return 'Avaliador'
    case 'discente':
      return 'Discente'
    default:
      return role
  }
}