import puppeteer from "puppeteer"
import type { Context } from "hono"
import { and, eq } from "drizzle-orm"
import { Bancas, Users, Cursos, usuariosBancas } from "../database/schema"
import { AppError } from "../utils/app-error"
import { err, ok, type AppResult } from "../utils/app-result"
import type { AppVariables } from "../utils/app-variables"

export interface BancaInfoForDocument {
  banca: {
    id: number
    titulo: string
    autor: string
    matricula: string | null
    turma: string
    periodoAcademico: string
    dataRealizacao: string
    local: string
    modalidade: "remoto" | "local"
    resumo: string | null
    abstract: string | null
    palavrasChave: string | null
    notaFinal: number | null
    visible: boolean
  }
  orientador: {
    id: number
    nome: string
    email: string
    matricula: string
    academicTitle: string
    school: string
  }
  aluno: {
    id: number
    nome: string
    email: string
    matricula: string
    academicTitle: string
    school: string
  }
  curso: {
    id: number
    nome: string
    sigla: string
  }
  membros: Array<{
    id: number
    nome: string
    email: string
    matricula: string
    academicTitle: string
    school: string
    role: "orientador" | "coorientador" | "avaliador" | "discente"
    nota: number | null
  }>
}

export type DocumentInfoError = 
  | { type: "banca_not_found" }
  | { type: "database_error"; error: unknown }

export type DocumentGenerationError = 
  | { type: "banca_not_found" }
  | { type: "access_denied" }
  | { type: "pdf_generation_error"; error: unknown }
  | { type: "database_error"; error: unknown }

export const getBancaInfoForDocument = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number
): Promise<AppResult<BancaInfoForDocument, DocumentInfoError>> => {
  const dbInstance = c.get("db")
  
  try {
    // Buscar a banca
    const bancaData = await dbInstance
      .select()
      .from(Bancas)
      .where(eq(Bancas.id, bancaId))
      .limit(1)
      
    if (bancaData.length === 0) {
      return err({ type: "banca_not_found" })
    }
    
    const banca = bancaData[0]
    
    // Buscar orientador
    const orientadorData = await dbInstance
      .select()
      .from(Users)
      .where(eq(Users.id, banca.orientadorId))
      .limit(1)
      
    // Buscar aluno
    const alunoData = await dbInstance
      .select()
      .from(Users)
      .where(eq(Users.id, banca.alunoId))
      .limit(1)
      
    // Buscar curso
    const cursoData = await dbInstance
      .select()
      .from(Cursos)
      .where(eq(Cursos.id, banca.cursoId))
      .limit(1)

    if (orientadorData.length === 0 || alunoData.length === 0 || cursoData.length === 0) {
      return err({ type: "database_error", error: "Missing required relationships" })
    }
    
    const orientador = orientadorData[0]
    const aluno = alunoData[0]
    const curso = cursoData[0]

    // Buscar todos os membros da banca
    const membrosData = await dbInstance
      .select({
        usuario: Users,
        usuarioBanca: usuariosBancas,
      })
      .from(usuariosBancas)
      .leftJoin(Users, eq(usuariosBancas.usuarioId, Users.id))
      .where(eq(usuariosBancas.bancaId, bancaId))

    const membros = membrosData
      .filter((m: any) => m.usuario) // Garantir que o usuário existe
      .map((m: any) => ({
        id: m.usuario!.id,
        nome: m.usuario!.nome,
        email: m.usuario!.email,
        matricula: m.usuario!.matricula,
        academicTitle: m.usuario!.academicTitle,
        school: m.usuario!.school,
        role: m.usuarioBanca.role,
        nota: m.usuarioBanca.nota,
      }))

    const bancaInfo: BancaInfoForDocument = {
      banca: {
        id: banca.id,
        titulo: banca.tituloTrabalho,
        autor: banca.autor,
        matricula: banca.matricula,
        turma: banca.turma,
        periodoAcademico: banca.periodoAcademico,
        dataRealizacao: banca.dataRealizacao,
        local: banca.local,
        modalidade: banca.modalidade,
        resumo: banca.resumo,
        abstract: banca.abstract,
        palavrasChave: banca.palavrasChave,
        notaFinal: banca.notaFinal,
        visible: banca.visible,
      },
      orientador,
      aluno,
      curso,
      membros,
    }

    return ok(bancaInfo)
  } catch (error) {
    console.error("Error fetching banca info:", error)
    return err({ type: "database_error", error })
  }
}

export const checkUserAccessToBanca = async (
  c: Context<{ Variables: AppVariables }>,
  bancaId: number,
  userId: number,
  documentType: "ata" | "participacao" | "orientacao"
): Promise<AppResult<boolean, DocumentGenerationError>> => {
  const dbInstance = c.get("db")
  
  try {
    // Verificar se o usuário tem acesso à banca
    const userBancaRelation = await dbInstance
      .select()
      .from(usuariosBancas)
      .where(
        and(
          eq(usuariosBancas.bancaId, bancaId),
          eq(usuariosBancas.usuarioId, userId)
        )
      )
      .limit(1)

    if (userBancaRelation.length === 0) {
      return err({ type: "access_denied" })
    }

    const userRole = userBancaRelation[0].role

    // Verificar acesso específico por tipo de documento
    switch (documentType) {
      case "ata":
        // Qualquer membro da banca pode acessar a ata
        return ok(true)
      
      case "participacao":
        // Qualquer membro da banca pode acessar sua declaração de participação
        return ok(true)
      
      case "orientacao":
        // Apenas orientadores e coorientadores podem acessar
        if (userRole === "orientador" || userRole === "coorientador") {
          return ok(true)
        }
        return err({ type: "access_denied" })
      
      default:
        return err({ type: "access_denied" })
    }
  } catch (error) {
    console.error("Error checking user access:", error)
    return err({ type: "database_error", error })
  }
}

export const generatePDFFromHTML = async (
  html: string,
  options: {
    format?: "A4" | "Letter"
    orientation?: "portrait" | "landscape"
    margin?: { top: string; right: string; bottom: string; left: string }
  } = {}
): Promise<AppResult<Buffer, DocumentGenerationError>> => {
  let browser
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: options.format || "A4",
      landscape: options.orientation === "landscape",
      margin: options.margin || {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm"
      },
      printBackground: true
    })
    
    return ok(Buffer.from(pdf))
  } catch (error) {
    console.error("Error generating PDF:", error)
    return err({ type: "pdf_generation_error", error })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}