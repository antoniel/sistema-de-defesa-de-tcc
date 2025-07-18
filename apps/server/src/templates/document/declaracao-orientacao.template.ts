import { baseDocumentTemplate } from "./base.template"
import type { BancaInfoForDocument } from "../../services/document.service"

export const generateDeclaracaoOrientacaoHTML = (
  bancaInfo: BancaInfoForDocument, 
  orientadorId: number
): string => {
  const { banca, orientador, aluno, curso, membros } = bancaInfo
  
  // Encontrar o orientador específico
  const orientadorMembro = membros.find(m => m.id === orientadorId && 
    (m.role === 'orientador' || m.role === 'coorientador'))
  
  if (!orientadorMembro) {
    throw new Error("Orientador não encontrado na banca")
  }
  
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('pt-BR')
  const formattedTime = currentDate.toLocaleTimeString('pt-BR')
  const defenseDate = new Date(banca.dataRealizacao).toLocaleDateString('pt-BR')
  
  const isOrientadorPrincipal = orientadorMembro.role === 'orientador'
  const tipoOrientacao = isOrientadorPrincipal ? 'orientação' : 'coorientação'
  const funcaoOrientacao = isOrientadorPrincipal ? 'Orientador' : 'Coorientador'
  
  const content = `
    <div class="header">
        <h1>Universidade Federal do Rio Grande do Norte</h1>
        <h2>Instituto de Computação</h2>
        <p>${curso.nome} (${curso.sigla})</p>
        <div class="mt-20">
            <h1>Declaração de ${funcaoOrientacao === 'Orientador' ? 'Orientação' : 'Coorientação'}</h1>
        </div>
    </div>

    <div class="content">
        <div class="section text-center mt-30">
            <h3>DECLARAÇÃO</h3>
        </div>

        <div class="section mt-30">
            <p class="text-left" style="text-indent: 2em; text-align: justify;">
                Declaro, para os devidos fins, que o(a) Professor(a) 
                <strong>${orientadorMembro.nome}</strong>, portador(a) da matrícula 
                <strong>${orientadorMembro.matricula}</strong>, com titulação de 
                <strong>${orientadorMembro.academicTitle}</strong>, vinculado(a) ao(à) 
                <strong>${orientadorMembro.school}</strong>, atuou como 
                <strong>${funcaoOrientacao}</strong> do Trabalho de Conclusão de Curso 
                intitulado <strong>"${banca.titulo}"</strong>, de autoria do(a) 
                discente <strong>${banca.autor}</strong>, matrícula 
                <strong>${banca.matricula || 'N/A'}</strong>, do curso de 
                <strong>${curso.nome}</strong>.
            </p>
        </div>

        <div class="section mt-20">
            <div class="info-row">
                <span class="info-label">Tipo de Orientação:</span>
                <span class="info-value font-bold">${funcaoOrientacao}</span>
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
            <div class="info-row">
                <span class="info-label">Período Acadêmico:</span>
                <span class="info-value">${banca.periodoAcademico}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Turma:</span>
                <span class="info-value">${banca.turma}</span>
            </div>
            ${banca.notaFinal ? `
            <div class="info-row">
                <span class="info-label">Nota Final:</span>
                <span class="info-value font-bold">${banca.notaFinal}</span>
            </div>
            ` : ''}
        </div>

        <div class="section mt-30">
            <h3>Dados do Orientando</h3>
            <div class="info-row">
                <span class="info-label">Nome:</span>
                <span class="info-value">${aluno.nome}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Matrícula:</span>
                <span class="info-value">${aluno.matricula}</span>
            </div>
            <div class="info-row">
                <span class="info-label">E-mail:</span>
                <span class="info-value">${aluno.email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Curso:</span>
                <span class="info-value">${curso.nome} (${curso.sigla})</span>
            </div>
        </div>

        <div class="section mt-30">
            <h3>Dados do Trabalho</h3>
            <div class="info-row">
                <span class="info-label">Título:</span>
                <span class="info-value">${banca.titulo}</span>
            </div>
            ${banca.resumo ? `
            <div class="mt-10">
                <span class="info-label font-bold">Resumo:</span>
                <p class="text-left mt-10" style="text-align: justify;">${banca.resumo}</p>
            </div>
            ` : ''}
            ${banca.palavrasChave ? `
            <div class="info-row mt-10">
                <span class="info-label">Palavras-chave:</span>
                <span class="info-value">${banca.palavrasChave}</span>
            </div>
            ` : ''}
        </div>

        <div class="section mt-30">
            <p class="text-left" style="text-align: justify;">
                Esta declaração é emitida para comprovação da atividade de ${tipoOrientacao} 
                exercida pelo(a) professor(a) supracitado(a), podendo ser utilizada para 
                fins de progressão funcional, relatórios de atividades docentes, comprovação 
                de produção acadêmica, ou outros fins que se fizerem necessários.
            </p>
        </div>

        <div class="section mt-20">
            <p class="text-left" style="text-align: justify;">
                Declaro ainda que a ${tipoOrientacao} foi realizada de forma adequada e 
                em conformidade com as normas acadêmicas vigentes, contribuindo para a 
                formação do(a) discente e para a qualidade do trabalho apresentado.
            </p>
        </div>

        ${isOrientadorPrincipal ? `
        <div class="section mt-20">
            <p class="text-left" style="text-align: justify;">
                Como orientador(a) principal, o(a) professor(a) foi responsável pelo 
                acompanhamento contínuo do desenvolvimento do trabalho, orientação 
                metodológica, revisão dos conteúdos e preparação do(a) discente para 
                a defesa pública.
            </p>
        </div>
        ` : `
        <div class="section mt-20">
            <p class="text-left" style="text-align: justify;">
                Como coorientador(a), o(a) professor(a) prestou apoio técnico e 
                científico especializado, contribuindo com conhecimentos específicos 
                para o desenvolvimento e aprimoramento do trabalho.
            </p>
        </div>
        `}
    </div>

    <div class="signature-section">
        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">
                ${orientador.nome}<br>
                Orientador(a) Principal - ${orientador.academicTitle}<br>
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
    .replace('{{title}}', `Declaração de ${funcaoOrientacao} - ${orientadorMembro.nome}`)
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