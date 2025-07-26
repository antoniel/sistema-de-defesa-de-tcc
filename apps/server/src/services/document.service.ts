import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import type { SelectBanca, SelectCurso, SelectUser, SelectUsuarioBanca } from "../database"
import { Bancas, Cursos, Users, usuariosBancas } from "../database/schema"
import { err, ok, type AppResult } from "../result"
import type { AppVariables } from "../types"

export interface BancaInfoForDocument {
  banca: Omit<SelectBanca, 'dataRealizacao' | 'local' | 'notaFinal'> & {
    dataRealizacao: string // ISO string for JSON serialization
    local: string // guaranteed non-null
    notaFinal: number | null // parsed from string
  }
  orientador: SelectUser
  aluno: SelectUser
  curso: SelectCurso
  membros: Array<Omit<SelectUser, 'passwordHash' | 'createdAt' | 'updatedAt'> & {
    role: SelectUsuarioBanca["role"]
    nota: number | null
  }>
}

export type DocumentInfoError = { type: "banca_not_found" } | { type: "database_error"; error: unknown }

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
    const bancaData = await dbInstance.select().from(Bancas).where(eq(Bancas.id, bancaId)).limit(1)

    if (bancaData.length === 0) {
      return err({ type: "banca_not_found" })
    }

    const banca = bancaData[0]

    // Buscar orientador
    const orientadorData = await dbInstance.select().from(Users).where(eq(Users.id, banca.orientadorId)).limit(1)

    // Buscar aluno
    const alunoData = await dbInstance.select().from(Users).where(eq(Users.id, banca.alunoId)).limit(1)

    // Buscar curso
    const cursoData = await dbInstance.select().from(Cursos).where(eq(Cursos.id, banca.cursoId)).limit(1)

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
        nota: m.usuarioBanca.nota ? parseFloat(m.usuarioBanca.nota) : null,
      }))

    const bancaInfo: BancaInfoForDocument = {
      banca: {
        ...banca,
        dataRealizacao: banca.dataRealizacao.toISOString(),
        local: banca.local || "",
        notaFinal: banca.notaFinal ? parseFloat(banca.notaFinal) : null,
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
      .where(and(eq(usuariosBancas.bancaId, bancaId), eq(usuariosBancas.usuarioId, userId)))
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

// PDF generation moved to frontend
// Backend now only provides data via getBancaInfoForDocument function
