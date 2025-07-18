import type { Context } from "hono"
import { match } from "ts-pattern"
import { AppError } from "../../utils/app-error"
import { 
  getBancaInfoForDocument, 
  checkUserAccessToBanca, 
  generatePDFFromHTML 
} from "../../services/document.service"
import { generateAtaDefesaHTML } from "../../templates/document/ata-defesa.template"
import { generateDeclaracaoParticipacaoHTML } from "../../templates/document/declaracao-participacao.template"
import { generateDeclaracaoOrientacaoHTML } from "../../templates/document/declaracao-orientacao.template"
import type { AppVariables } from "../../utils/app-variables"

export const getBancaDocumentInfo = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
) => {
  const result = await getBancaInfoForDocument(c, bancaId)
  
  if (!result.ok) {
    throw match(result.error)
      .with({ type: "banca_not_found" }, () => new AppError(404, "Banca não encontrada"))
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .exhaustive()
  }

  return result.data
}

export const generateAtaDefesa = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number
) => {
  // Verificar acesso do usuário
  const accessResult = await checkUserAccessToBanca(c, bancaId, userId, "ata")
  if (!accessResult.ok) {
    throw match(accessResult.error)
      .with({ type: "access_denied" }, () => new AppError(403, "Acesso negado"))
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .exhaustive()
  }

  // Buscar informações da banca
  const bancaInfo = await getBancaDocumentInfo(c, bancaId)

  // Gerar HTML da ata
  const html = generateAtaDefesaHTML(bancaInfo)
  
  // Gerar PDF
  const pdfResult = await generatePDFFromHTML(html)
  if (!pdfResult.ok) {
    throw match(pdfResult.error)
      .with({ type: "pdf_generation_error" }, () => new AppError(500, "Erro ao gerar PDF"))
      .exhaustive()
  }

  return {
    pdf: pdfResult.data,
    fileName: `ata-defesa-${bancaInfo.banca.id}.pdf`
  }
}

export const generateDeclaracaoParticipacao = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number
) => {
  // Verificar acesso do usuário
  const accessResult = await checkUserAccessToBanca(c, bancaId, userId, "participacao")
  if (!accessResult.ok) {
    throw match(accessResult.error)
      .with({ type: "access_denied" }, () => new AppError(403, "Acesso negado"))
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .exhaustive()
  }

  // Buscar informações da banca
  const bancaInfo = await getBancaDocumentInfo(c, bancaId)

  // Gerar HTML da declaração
  const html = generateDeclaracaoParticipacaoHTML(bancaInfo, userId)
  
  // Gerar PDF
  const pdfResult = await generatePDFFromHTML(html)
  if (!pdfResult.ok) {
    throw match(pdfResult.error)
      .with({ type: "pdf_generation_error" }, () => new AppError(500, "Erro ao gerar PDF"))
      .exhaustive()
  }

  return {
    pdf: pdfResult.data,
    fileName: `declaracao-participacao-${bancaInfo.banca.id}.pdf`
  }
}

export const generateDeclaracaoOrientacao = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number
) => {
  // Verificar acesso do usuário
  const accessResult = await checkUserAccessToBanca(c, bancaId, userId, "orientacao")
  if (!accessResult.ok) {
    throw match(accessResult.error)
      .with({ type: "access_denied" }, () => new AppError(403, "Acesso negado"))
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno do servidor"))
      .exhaustive()
  }

  // Buscar informações da banca
  const bancaInfo = await getBancaDocumentInfo(c, bancaId)

  // Gerar HTML da declaração
  const html = generateDeclaracaoOrientacaoHTML(bancaInfo, userId)
  
  // Gerar PDF
  const pdfResult = await generatePDFFromHTML(html)
  if (!pdfResult.ok) {
    throw match(pdfResult.error)
      .with({ type: "pdf_generation_error" }, () => new AppError(500, "Erro ao gerar PDF"))
      .exhaustive()
  }

  return {
    pdf: pdfResult.data,
    fileName: `declaracao-orientacao-${bancaInfo.banca.id}.pdf`
  }
}