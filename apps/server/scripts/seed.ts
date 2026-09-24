import {
  Bancas,
  Cursos,
  db,
  type InsertBanca,
  type InsertCurso,
  type InsertUser,
  type InsertUsuarioBanca,
  Users,
  usuariosBancas,
} from "../src/database"

/**
 * Seed de desenvolvimento com dados 100% SINTÉTICOS.
 *
 * Nenhum dado real de aluno, professor ou orientador deve entrar aqui. Use sempre
 * nomes fictícios, domínios reservados (`@synthetic.test` / `@example.com`) e
 * matrículas inventadas. Nunca copie registros de um dump de produção.
 *
 * A senha de todos os usuários semeados é `TEST_PASSWORD` abaixo.
 */
const TEST_PASSWORD = "senha-de-teste-123"
const TEST_PASSWORD_HASH = "$2b$13$Pwsbm5xE5rW6EcLgz5v/qujLIgtC64sYxgcyaolqz2.kHqkYjbthG"

async function seed() {
  await db.transaction(async (db) => {
    // --- Seed Cursos ---
    console.log("Seeding cursos...")
    await db.insert(Cursos).values(cursosData).onConflictDoNothing()
    console.log(`Seeded ${cursosData.length} cursos.`)

    // --- Seed Usuarios ---
    console.log("Seeding usuarios...")
    await db.insert(Users).values(usersData).onConflictDoNothing()
    console.log(`Seeded ${usersData.length} usuarios.`)

    // --- Seed Bancas ---
    console.log("Seeding bancas...")
    await db.insert(Bancas).values(bancasData).onConflictDoNothing()
    console.log(`Seeded ${bancasData.length} bancas.`)

    // --- Seed UsuarioBanca ---
    console.log("Seeding usuarios_bancas...")
    await db.insert(usuariosBancas).values(usuariosBancasData).onConflictDoNothing()
    console.log(`Seeded ${usuariosBancasData.length} usuario_banca relations.`)
  })
}

seed()
  .then(() => {
    console.log(`\nSenha de todos os usuários semeados: ${TEST_PASSWORD}`)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error seeding database:", error)
    process.exit(1)
  })

const cursosData: InsertCurso[] = [
  {
    id: 1,
    nome: "Ciência da Computação",
    sigla: "BCC",
  },
  {
    id: 2,
    nome: "Sistemas de Informação",
    sigla: "BSI",
  },
]

const usersData: InsertUser[] = [
  {
    id: 1,
    passwordHash: TEST_PASSWORD_HASH,
    email: "admin@synthetic.test",
    nome: "Admin Sintético",
    school: "Universidade Sintética",
    academicTitle: "Bacharelado",
    matricula: "900000001",
    createdAt: new Date("2024-01-01T09:00:00Z"),
    updatedAt: new Date("2024-01-01T09:00:00Z"),
    role: "ADMIN",
  },
  {
    id: 2,
    passwordHash: TEST_PASSWORD_HASH,
    email: "orientador@synthetic.test",
    nome: "Oriana Orientadora",
    school: "Universidade Sintética",
    academicTitle: "Doutora em Ciência da Computação",
    matricula: "900000002",
    createdAt: new Date("2024-01-02T09:00:00Z"),
    updatedAt: new Date("2024-01-02T09:00:00Z"),
    role: "TEACHER",
  },
  {
    id: 3,
    passwordHash: TEST_PASSWORD_HASH,
    email: "avaliador1@synthetic.test",
    nome: "Avaldo Avaliador",
    school: "Universidade Sintética",
    academicTitle: "Doutor em Sistemas Distribuídos",
    matricula: "900000003",
    createdAt: new Date("2024-01-03T09:00:00Z"),
    updatedAt: new Date("2024-01-03T09:00:00Z"),
    role: "TEACHER",
  },
  {
    id: 4,
    passwordHash: TEST_PASSWORD_HASH,
    email: "avaliadora2@synthetic.test",
    nome: "Beatriz Banca",
    school: "Universidade Sintética",
    academicTitle: "Doutora em Engenharia de Software",
    matricula: "900000004",
    createdAt: new Date("2024-01-04T09:00:00Z"),
    updatedAt: new Date("2024-01-04T09:00:00Z"),
    role: "TEACHER",
  },
  {
    id: 5,
    passwordHash: TEST_PASSWORD_HASH,
    email: "aluno@synthetic.test",
    nome: "Aluno Sintético",
    school: "Universidade Sintética",
    academicTitle: "Bacharelado",
    matricula: "900000005",
    createdAt: new Date("2024-01-05T09:00:00Z"),
    updatedAt: new Date("2024-01-05T09:00:00Z"),
    role: "STUDENT",
  },
  {
    id: 6,
    passwordHash: TEST_PASSWORD_HASH,
    email: "aluna@synthetic.test",
    nome: "Aluna Sintética",
    school: "Universidade Sintética",
    academicTitle: "Bacharelado",
    matricula: "900000006",
    createdAt: new Date("2024-01-06T09:00:00Z"),
    updatedAt: new Date("2024-01-06T09:00:00Z"),
    role: "STUDENT",
  },
]

const bancasData: InsertBanca[] = [
  {
    id: 1,
    cursoId: 1,
    alunoId: 5,
    orientadorId: 2,
    autor: "Aluno Sintético",
    turma: "2024.1",
    periodoAcademico: "2024.1",
    matricula: "900000005",
    tituloTrabalho: "Um Sistema de Exemplo para Demonstração de Defesas",
    resumo:
      "Trabalho sintético de exemplo, usado apenas para popular o ambiente de desenvolvimento. Nenhum dado real está associado a este registro.",
    abstract:
      "Synthetic sample work, used only to populate the development environment. No real data is associated with this record.",
    palavrasChave: "dados sintéticos, exemplo, desenvolvimento",
    dataRealizacao: new Date("2024-06-10T13:00:00Z"),
    notaFinal: "10",
    local: "Sala 101 - Bloco Sintético",
    modalidade: "local",
    visible: true,
  },
  {
    id: 2,
    cursoId: 1,
    alunoId: 6,
    orientadorId: 2,
    autor: "Aluna Sintética",
    turma: "2024.1",
    periodoAcademico: "2024.1",
    matricula: "900000006",
    tituloTrabalho: "Avaliação de Usabilidade em Aplicações de Exemplo",
    resumo:
      "Segundo trabalho sintético de exemplo, restrito (não visível publicamente), para exercitar o fluxo de bancas privadas.",
    abstract:
      "Second synthetic sample work, restricted (not publicly visible), to exercise the private defense flow.",
    palavrasChave: "usabilidade, avaliação, dados sintéticos",
    dataRealizacao: new Date("2024-07-15T14:00:00Z"),
    notaFinal: null,
    local: "https://example.com/reuniao-sintetica",
    modalidade: "remoto",
    visible: false,
  },
  {
    id: 3,
    cursoId: 2,
    alunoId: 5,
    orientadorId: 3,
    autor: "Aluno Sintético",
    turma: "2024.2",
    periodoAcademico: "2024.2",
    matricula: "900000005",
    tituloTrabalho: "Estudo de Caso Sintético em Sistemas de Informação",
    resumo:
      "Terceiro trabalho sintético de exemplo, vinculado a outro curso para exercitar a regra de uma banca por aluno/curso.",
    abstract:
      "Third synthetic sample work, linked to another course to exercise the one-defense-per-student/course rule.",
    palavrasChave: "estudo de caso, sistemas de informação, exemplo",
    dataRealizacao: new Date("2024-11-20T10:00:00Z"),
    notaFinal: null,
    local: "Sala 202 - Bloco Sintético",
    modalidade: "local",
    visible: true,
  },
]

const usuariosBancasData: InsertUsuarioBanca[] = [
  { id: 1, usuarioId: 2, bancaId: 1, role: "orientador", nota: "10" },
  { id: 2, usuarioId: 3, bancaId: 1, role: "avaliador", nota: "9.5" },
  { id: 3, usuarioId: 4, bancaId: 1, role: "avaliador", nota: "10" },
  { id: 4, usuarioId: 2, bancaId: 2, role: "orientador", nota: null },
  { id: 5, usuarioId: 4, bancaId: 2, role: "avaliador", nota: null },
  { id: 6, usuarioId: 3, bancaId: 3, role: "orientador", nota: null },
  { id: 7, usuarioId: 4, bancaId: 3, role: "avaliador", nota: null },
]
