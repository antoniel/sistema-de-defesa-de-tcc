import { baseDocumentTemplate } from "./base.template"
import type { BancaInfoForDocument } from "../../services/document.service"

export const generateAtaDefesaHTML = (bancaInfo: BancaInfoForDocument): string => {
  const { banca, orientador, aluno, curso, membros } = bancaInfo
  
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('pt-BR')
  const formattedTime = currentDate.toLocaleTimeString('pt-BR')
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString('pt-BR')
  
  // Separar membros por tipo
  const orientadores = membros.filter(m => m.role === 'orientador')
  const coorientadores = membros.filter(m => m.role === 'coorientador')
  const avaliadores = membros.filter(m => m.role === 'avaliador')
  
  const content = `
    <div class="header">
        <h1>Universidade Federal do Rio Grande do Norte</h1>
        <h2>Instituto de Computação</h2>
        <p>${curso.nome} (${curso.sigla})</p>
        <div class="mt-20">
            <h1>Ata de Defesa de Trabalho de Conclusão de Curso</h1>
        </div>
    </div>

    <div class="content">
        <div class="section">
            <h3>Identificação do Trabalho</h3>
            <div class="info-row">
                <span class="info-label">Título:</span>
                <span class="info-value">${banca.titulo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Autor:</span>
                <span class="info-value">${banca.autor}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Matrícula:</span>
                <span class="info-value">${banca.matricula || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Turma:</span>
                <span class="info-value">${banca.turma}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Período Acadêmico:</span>
                <span class="info-value">${banca.periodoAcademico}</span>
            </div>
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
        </div>

        <div class="section">
            <h3>Composição da Banca Examinadora</h3>
            
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Função</th>
                        <th>Titulação</th>
                        <th>Instituição</th>
                        <th>Nota</th>
                    </tr>
                </thead>
                <tbody>
                    ${membros.map(membro => `
                        <tr>
                            <td>${membro.nome}</td>
                            <td>${getRoleName(membro.role)}</td>
                            <td>${membro.academicTitle}</td>
                            <td>${membro.school}</td>
                            <td class="text-center">${membro.nota || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${banca.resumo ? `
        <div class="section">
            <h3>Resumo do Trabalho</h3>
            <p class="text-left">${banca.resumo}</p>
        </div>
        ` : ''}

        ${banca.palavrasChave ? `
        <div class="section">
            <h3>Palavras-chave</h3>
            <p class="text-left">${banca.palavrasChave}</p>
        </div>
        ` : ''}

        <div class="section">
            <h3>Resultado da Avaliação</h3>
            <div class="info-row">
                <span class="info-label">Nota Final:</span>
                <span class="info-value font-bold">${banca.notaFinal || 'Não informada'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Situação:</span>
                <span class="info-value font-bold">${banca.notaFinal && banca.notaFinal >= 7 ? 'APROVADO' : 'PENDENTE'}</span>
            </div>
        </div>

        <div class="section mt-30">
            <p class="text-left">
                Aos ${defenseDate}, realizou-se a defesa do Trabalho de Conclusão de Curso intitulado 
                "${banca.titulo}", de autoria de ${banca.autor}, 
                matricula ${banca.matricula || 'N/A'}, do curso de ${curso.nome}.
            </p>
            <p class="text-left mt-10">
                A banca examinadora foi composta pelos membros relacionados acima, sob a presidência do(a) 
                orientador(a) ${orientador.nome}.
            </p>
            <p class="text-left mt-10">
                Após a apresentação do trabalho e arguição pelos membros da banca, o candidato foi 
                ${banca.notaFinal && banca.notaFinal >= 7 ? 'APROVADO' : 'AVALIADO'} 
                com nota ${banca.notaFinal || 'a ser definida'}.
            </p>
        </div>
    </div>

    <div class="signature-section">
        <h3 class="mb-30">Assinaturas da Banca Examinadora</h3>
        
        ${membros.map(membro => `
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">
                    ${membro.nome}<br>
                    ${getRoleName(membro.role)} - ${membro.academicTitle}<br>
                    ${membro.school}
                </div>
            </div>
        `).join('')}
    </div>
  `

  return baseDocumentTemplate
    .replace('{{title}}', 'Ata de Defesa - ' + banca.titulo)
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