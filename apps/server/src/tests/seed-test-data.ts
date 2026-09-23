import * as bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"
import {
  E2E_ACCOUNTS,
  E2E_BANCAS,
  E2E_CURSOS,
  E2E_FUTURE_DATE,
  E2E_PAST_DATE,
  E2E_PASSWORD,
} from "@tcc/tests"
import {
  Bancas,
  bancasDocumentos,
  Cursos,
  documentos,
  feedbackSubmissions,
  featureRequests,
  featureRequestVotes,
  invites,
  resetPasswords,
  sessions,
  studentInvitations,
  teacherInvitations,
  Users,
  usuariosBancas,
  type Database,
} from "../database"

/**
 * Tabelas cujo `id` é serial e recebem INSERT da aplicação.
 * O seed usa IDs explícitos, então as sequences precisam ser sincronizadas —
 * sem isso o próximo `nextval` devolve 1 e estoura `usuario_pkey`.
 */
const SEQUENCED_TABLES = [
  "usuario",
  "cursos",
  "banca",
  "documento",
  "invite",
  "reset_password",
  "teacher_invitation",
  "student_invitation",
  "usuario_banca",
  "banca_documento",
  "feedback_submission",
  "feature_request",
  "feature_request_vote",
]

const syncSequences = async (db: Database) => {
  for (const table of SEQUENCED_TABLES) {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
      ),
    )
  }
}

/**
 * Limpa todas as tabelas na ordem correta de dependência.
 * Usado pelo `POST /__test__/reset` e pelo boot do servidor de teste.
 */
export const clearTestData = async (db: Database) => {
  await db.delete(bancasDocumentos)
  await db.delete(usuariosBancas)
  await db.delete(invites)
  await db.delete(resetPasswords)
  await db.delete(teacherInvitations)
  await db.delete(studentInvitations)
  await db.delete(featureRequestVotes)
  await db.delete(featureRequests)
  await db.delete(feedbackSubmissions)
  await db.delete(sessions)
  await db.delete(Bancas)
  await db.delete(documentos)
  await db.delete(Users)
  await db.delete(Cursos)
}

/**
 * Popula o banco de teste com dados determinísticos.
 *
 * Os IDs são explícitos para que as specs possam apontar para entidades conhecidas
 * sem descobri-las em runtime. As datas são absolutas (2099/2020) para que
 * "próximas" e "anteriores" não mudem conforme o dia em que a suíte roda.
 */
export const seedTestData = async (db: Database) => {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10)
  const now = new Date()

  await db.insert(Cursos).values([
    { id: E2E_CURSOS.bcc.id, nome: E2E_CURSOS.bcc.nome, sigla: E2E_CURSOS.bcc.sigla },
    { id: E2E_CURSOS.bsi.id, nome: E2E_CURSOS.bsi.nome, sigla: E2E_CURSOS.bsi.sigla },
  ])

  const accounts = Object.values(E2E_ACCOUNTS)
  await db.insert(Users).values(
    accounts.map((account) => ({
      id: account.id,
      email: account.email,
      nome: account.nome,
      role: account.role,
      matricula: account.matricula,
      academicTitle: account.academicTitle,
      school: "Instituto de Computação",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })),
  )

  await db.insert(Bancas).values([
    {
      id: E2E_BANCAS.upcomingPublic.id,
      tituloTrabalho: E2E_BANCAS.upcomingPublic.tituloTrabalho,
      cursoId: E2E_BANCAS.upcomingPublic.cursoId,
      alunoId: E2E_BANCAS.upcomingPublic.alunoId,
      orientadorId: E2E_BANCAS.upcomingPublic.orientadorId,
      autor: E2E_ACCOUNTS.busyStudent.nome,
      matricula: E2E_ACCOUNTS.busyStudent.matricula,
      turma: "GICC0002 PROJETO FINAL DE CURSO II",
      periodoAcademico: "2026.1",
      resumo: "Resumo da banca futura pública do ambiente de E2E.",
      abstract: "Abstract of the upcoming public banca in the E2E environment.",
      palavrasChave: "e2e, futura, pública",
      dataRealizacao: E2E_FUTURE_DATE,
      local: "https://meet.google.com/e2e-upcoming",
      modalidade: "remoto",
      visible: true,
    },
    {
      id: E2E_BANCAS.pastPublic.id,
      tituloTrabalho: E2E_BANCAS.pastPublic.tituloTrabalho,
      cursoId: E2E_BANCAS.pastPublic.cursoId,
      alunoId: E2E_BANCAS.pastPublic.alunoId,
      orientadorId: E2E_BANCAS.pastPublic.orientadorId,
      autor: E2E_ACCOUNTS.busyStudent.nome,
      matricula: E2E_ACCOUNTS.busyStudent.matricula,
      turma: "GICC0002 PROJETO FINAL DE CURSO II",
      periodoAcademico: "2020.1",
      resumo: "Resumo da banca passada pública do ambiente de E2E.",
      abstract: "Abstract of the past public banca in the E2E environment.",
      palavrasChave: "e2e, passada, pública",
      dataRealizacao: E2E_PAST_DATE,
      local: "Sala 301 - Instituto de Computação",
      modalidade: "local",
      notaFinal: "9.5",
      visible: true,
    },
    {
      id: E2E_BANCAS.upcomingPrivate.id,
      tituloTrabalho: E2E_BANCAS.upcomingPrivate.tituloTrabalho,
      cursoId: E2E_BANCAS.upcomingPrivate.cursoId,
      alunoId: E2E_BANCAS.upcomingPrivate.alunoId,
      orientadorId: E2E_BANCAS.upcomingPrivate.orientadorId,
      autor: E2E_ACCOUNTS.privateStudent.nome,
      matricula: E2E_ACCOUNTS.privateStudent.matricula,
      turma: "GICC0002 PROJETO FINAL DE CURSO II",
      periodoAcademico: "2026.1",
      resumo: "Resumo da banca futura privada do ambiente de E2E.",
      abstract: "Abstract of the upcoming private banca in the E2E environment.",
      palavrasChave: "e2e, futura, privada",
      dataRealizacao: E2E_FUTURE_DATE,
      local: "https://meet.google.com/e2e-private",
      modalidade: "remoto",
      visible: false,
    },
  ])

  await db.insert(usuariosBancas).values([
    {
      bancaId: E2E_BANCAS.upcomingPublic.id,
      usuarioId: E2E_ACCOUNTS.teacher.id,
      role: "orientador",
    },
    { bancaId: E2E_BANCAS.upcomingPublic.id, usuarioId: E2E_ACCOUNTS.busyStudent.id, role: "aluno" },
    {
      bancaId: E2E_BANCAS.upcomingPublic.id,
      usuarioId: E2E_ACCOUNTS.teacher2.id,
      role: "avaliador",
    },
    {
      bancaId: E2E_BANCAS.pastPublic.id,
      usuarioId: E2E_ACCOUNTS.teacher2.id,
      role: "orientador",
      nota: "9.5",
    },
    { bancaId: E2E_BANCAS.pastPublic.id, usuarioId: E2E_ACCOUNTS.busyStudent.id, role: "aluno" },
    {
      bancaId: E2E_BANCAS.pastPublic.id,
      usuarioId: E2E_ACCOUNTS.teacher.id,
      role: "avaliador",
      nota: "9.0",
    },
    {
      bancaId: E2E_BANCAS.upcomingPrivate.id,
      usuarioId: E2E_ACCOUNTS.teacher.id,
      role: "orientador",
    },
    { bancaId: E2E_BANCAS.upcomingPrivate.id, usuarioId: E2E_ACCOUNTS.privateStudent.id, role: "aluno" },
  ])

  /* Depois de inserir IDs explícitos, alinha as sequences com o maior id de cada tabela. */
  await syncSequences(db)
}

/** Limpa e repopula. Idempotente — pode rodar quantas vezes quiser. */
export const resetTestData = async (db: Database) => {
  await clearTestData(db)
  await seedTestData(db)
}
