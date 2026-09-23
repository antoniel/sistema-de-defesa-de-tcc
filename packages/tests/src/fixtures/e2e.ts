/**
 * Contas e entidades determinísticas do ambiente de E2E.
 *
 * Fonte única de verdade: o seed do servidor de teste (`apps/server/src/tests/seed-test-data.ts`)
 * e as specs do Playwright (`apps/web/tests/`) importam daqui, então os e-mails nunca saem de sincronia.
 *
 * Regras para manter o E2E sem flake:
 * - IDs e e-mails são fixos; nunca dependa de auto-incremento.
 * - Datas são absolutas (2099/2020), não `agora ± N dias`, para não virar o dia no meio da suíte.
 * - Specs que precisam de entidade "virgem" (ex.: aluno sem banca) devem CRIAR a sua via API
 *   com e-mail único — não consuma as contas do seed.
 */

/** Senha de todas as contas do seed. */
export const E2E_PASSWORD = "senha-e2e-123"

/** Papéis disponíveis no seed, na ordem em que aparecem nas fixtures do Playwright. */
export type E2ERole = "admin" | "teacher" | "student"

export interface E2EAccount {
  id: number
  email: string
  nome: string
  role: "ADMIN" | "TEACHER" | "STUDENT"
  matricula: string
  academicTitle: string
}

/**
 * Contas do seed.
 *
 * - `admin`      — pode tudo
 * - `teacher`    — orientador das bancas 1 e 3
 * - `teacher2`   — orientador da banca 2 e avaliador
 * - `teacher3`   — avaliador de reserva
 * - `busyStudent`— já tem banca nos dois cursos (não aparece em "disponíveis")
 * - `freeStudent`— sem banca (usado por testes que não criam aluno próprio)
 * - `privateStudent` — dono da banca privada (banca 3)
 */
export const E2E_ACCOUNTS = {
  admin: {
    id: 1,
    email: "admin@e2e.local",
    nome: "Admin E2E",
    role: "ADMIN",
    matricula: "E2E-ADM",
    academicTitle: "Doutorado",
  },
  teacher: {
    id: 2,
    email: "teacher@e2e.local",
    nome: "Orientador E2E",
    role: "TEACHER",
    matricula: "E2E-ORI",
    academicTitle: "Doutorado",
  },
  teacher2: {
    id: 3,
    email: "teacher2@e2e.local",
    nome: "Avaliador E2E",
    role: "TEACHER",
    matricula: "E2E-AVA",
    academicTitle: "Doutorado",
  },
  teacher3: {
    id: 4,
    email: "teacher3@e2e.local",
    nome: "Avaliador Reserva E2E",
    role: "TEACHER",
    matricula: "E2E-AVA2",
    academicTitle: "Mestrado",
  },
  busyStudent: {
    id: 5,
    email: "student.busy@e2e.local",
    nome: "Aluno Ocupado E2E",
    role: "STUDENT",
    matricula: "E2E-ALU1",
    academicTitle: "Graduando",
  },
  freeStudent: {
    id: 6,
    email: "student.free@e2e.local",
    nome: "Aluno Livre E2E",
    role: "STUDENT",
    matricula: "E2E-ALU2",
    academicTitle: "Graduando",
  },
  privateStudent: {
    id: 7,
    email: "student.private@e2e.local",
    nome: "Aluno Privado E2E",
    role: "STUDENT",
    matricula: "E2E-ALU3",
    academicTitle: "Graduando",
  },
} as const satisfies Record<string, E2EAccount>

/** Credenciais prontas para `POST /auth/login`. */
export const E2E_CREDENTIALS = {
  admin: { email: E2E_ACCOUNTS.admin.email, password: E2E_PASSWORD },
  teacher: { email: E2E_ACCOUNTS.teacher.email, password: E2E_PASSWORD },
  teacher2: { email: E2E_ACCOUNTS.teacher2.email, password: E2E_PASSWORD },
  teacher3: { email: E2E_ACCOUNTS.teacher3.email, password: E2E_PASSWORD },
  busyStudent: { email: E2E_ACCOUNTS.busyStudent.email, password: E2E_PASSWORD },
  freeStudent: { email: E2E_ACCOUNTS.freeStudent.email, password: E2E_PASSWORD },
  privateStudent: { email: E2E_ACCOUNTS.privateStudent.email, password: E2E_PASSWORD },
} as const

/** Cursos do seed. */
export const E2E_CURSOS = {
  bcc: { id: 1, nome: "Ciência da Computação", sigla: "BCC" },
  bsi: { id: 2, nome: "Sistemas de Informação", sigla: "BSI" },
} as const

/** Bancas do seed. */
export const E2E_BANCAS = {
  /** Futura, pública, remota. Sem `linkTrabalho`. */
  upcomingPublic: {
    id: 1,
    tituloTrabalho: "Banca Futura Pública E2E",
    cursoId: E2E_CURSOS.bcc.id,
    alunoId: E2E_ACCOUNTS.busyStudent.id,
    orientadorId: E2E_ACCOUNTS.teacher.id,
  },
  /** Passada, pública, presencial, com nota final. */
  pastPublic: {
    id: 2,
    tituloTrabalho: "Banca Passada Pública E2E",
    cursoId: E2E_CURSOS.bsi.id,
    alunoId: E2E_ACCOUNTS.busyStudent.id,
    orientadorId: E2E_ACCOUNTS.teacher2.id,
  },
  /** Futura e PRIVADA — só admin, orientador e membros enxergam. */
  upcomingPrivate: {
    id: 3,
    tituloTrabalho: "Banca Futura Privada E2E",
    cursoId: E2E_CURSOS.bcc.id,
    alunoId: E2E_ACCOUNTS.privateStudent.id,
    orientadorId: E2E_ACCOUNTS.teacher.id,
  },
} as const

/** Data no futuro distante — sempre "próxima", independente de quando a suíte roda. */
export const E2E_FUTURE_DATE = new Date("2099-06-15T14:00:00.000Z")
/** Data no passado distante — sempre "anterior". */
export const E2E_PAST_DATE = new Date("2020-06-15T14:00:00.000Z")
