import {
  Bancas,
  Cursos,
  Users,
  usuariosBancas,
  type Database,
  type InsertBanca,
  type InsertCurso,
  type InsertUser,
  type InsertUsuarioBanca,
} from "../database"

export const seedTestData = async (db: Database) => {
  console.log("🌱 Seeding test data...")

  try {
    // Seed Cursos
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

    await db.insert(Cursos).values(cursosData).onConflictDoNothing()
    console.log("✅ Cursos seeded")

    // Seed Users
    const adminPasswordHash = "$2b$10$Tc0O8gfKK5QQNCEOaZzQ2uFaekULT0N3mWxaZ/aVp0q29zNBYN79S"
    const usersData: InsertUser[] = [
      {
        id: 1,
        passwordHash: adminPasswordHash,
        email: "admin@test.com",
        nome: "Admin Test",
        school: "UFBA",
        academicTitle: "Doutor",
        matricula: "ADM123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "ADMIN",
      },
      {
        id: 2,
        passwordHash: adminPasswordHash,
        email: "teacher@test.com",
        nome: "Professor Test",
        school: "UFBA",
        academicTitle: "Doutor",
        matricula: "PROF123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "TEACHER",
      },
      {
        id: 3,
        passwordHash: adminPasswordHash,
        email: "student@test.com",
        nome: "Aluno Test",
        school: "UFBA",
        academicTitle: "Bacharel",
        matricula: "STU123",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "STUDENT",
      },
      {
        id: 4,
        passwordHash: adminPasswordHash,
        email: "teacher2@test.com",
        nome: "Professor Test 2",
        school: "UFBA",
        academicTitle: "Doutor",
        matricula: "PROF456",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "TEACHER",
      },
    ]

    await db.insert(Users).values(usersData).onConflictDoNothing()
    console.log("✅ Users seeded")

    // Seed Bancas - Some upcoming and some past
    const now = new Date()
    const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    const futureDate3 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) // 21 days from now
    const pastDate1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    const pastDate2 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 14 days ago

    const bancasData: InsertBanca[] = [
      // Upcoming bancas
      {
        id: 1,
        cursoId: 1,
        alunoId: 3,
        orientadorId: 2,
        autor: "Aluno Test",
        turma: "2024.1",
        periodoAcademico: "2024.1",
        matricula: "STU123",
        modalidade: "remoto",
        tituloTrabalho: "Sistema de Recomendação para Testes E2E",
        resumo: "Este trabalho apresenta um sistema de recomendação para testes automatizados end-to-end.",
        abstract: "This work presents a recommendation system for automated end-to-end tests.",
        palavrasChave: "testes, e2e, sistemas de recomendação",
        dataRealizacao: futureDate1,
        notaFinal: null,
        local: "https://meet.google.com/test-123",
        visible: true,
      },
      {
        id: 2,
        cursoId: 1,
        alunoId: 3,
        orientadorId: 2,
        autor: "Aluno Test 2",
        turma: "2024.1",
        periodoAcademico: "2024.1",
        matricula: "STU456",
        modalidade: "local",
        tituloTrabalho: "Análise de Performance em Aplicações Web",
        resumo: "Análise detalhada de performance em aplicações web modernas.",
        abstract: "Detailed performance analysis of modern web applications.",
        palavrasChave: "performance, web, análise",
        dataRealizacao: futureDate2,
        notaFinal: null,
        local: "Sala 301 - Instituto de Computação",
        visible: true,
      },
      {
        id: 3,
        cursoId: 2,
        alunoId: 3,
        orientadorId: 4,
        autor: "Aluno Test 3",
        turma: "2024.1",
        periodoAcademico: "2024.1",
        matricula: "STU789",
        modalidade: "remoto",
        tituloTrabalho: "Desenvolvimento de API RESTful com Node.js",
        resumo: "Desenvolvimento de uma API RESTful moderna usando Node.js e TypeScript.",
        abstract: "Development of a modern RESTful API using Node.js and TypeScript.",
        palavrasChave: "api, nodejs, typescript",
        dataRealizacao: futureDate3,
        notaFinal: null,
        local: "https://meet.google.com/test-456",
        visible: true,
      },
      // Past bancas
      {
        id: 4,
        cursoId: 1,
        alunoId: 3,
        orientadorId: 2,
        autor: "Aluno Test 4",
        turma: "2023.2",
        periodoAcademico: "2023.2",
        matricula: "STU101",
        modalidade: "local",
        tituloTrabalho: "Sistema de Gerenciamento de Tarefas",
        resumo: "Sistema web para gerenciamento de tarefas e projetos.",
        abstract: "Web system for task and project management.",
        palavrasChave: "gerenciamento, tarefas, web",
        dataRealizacao: pastDate1,
        notaFinal: "9.5",
        local: "Sala 201 - Instituto de Computação",
        visible: true,
      },
      {
        id: 5,
        cursoId: 2,
        alunoId: 3,
        orientadorId: 4,
        autor: "Aluno Test 5",
        turma: "2023.2",
        periodoAcademico: "2023.2",
        matricula: "STU202",
        modalidade: "remoto",
        tituloTrabalho: "Análise de Dados com Python",
        resumo: "Análise de dados utilizando Python e bibliotecas modernas.",
        abstract: "Data analysis using Python and modern libraries.",
        palavrasChave: "análise, dados, python",
        dataRealizacao: pastDate2,
        notaFinal: "8.5",
        local: "https://meet.google.com/test-789",
        visible: true,
      },
    ]

    const insertedBancas = await db.insert(Bancas).values(bancasData).onConflictDoNothing().returning()
    console.log(
      "✅ Bancas seeded:",
      insertedBancas.map((b) => b.id)
    )

    // Use the actual IDs returned from the database
    const bancaIds = insertedBancas.map((b) => b.id)

    // Seed UsuarioBanca relations - only for successfully inserted bancas
    const usuariosBancasData: InsertUsuarioBanca[] = []

    // Add relations for each successfully inserted banca
    bancaIds.forEach((bancaId, index) => {
      if (bancaId) {
        usuariosBancasData.push(
          { usuarioId: 2, bancaId: bancaId, role: "orientador", nota: index >= 3 ? "9.5" : null },
          { usuarioId: 4, bancaId: bancaId, role: "avaliador", nota: index >= 3 ? "9.0" : null }
        )
      }
    })

    await db.insert(usuariosBancas).values(usuariosBancasData).onConflictDoNothing()
    console.log("✅ UsuarioBanca relations seeded")

    console.log("✅ Test data seeded successfully!")
    console.log(`   - ${cursosData.length} cursos`)
    console.log(`   - ${usersData.length} users`)
    console.log(`   - ${bancasData.length} bancas`)
    console.log(`   - ${usuariosBancasData.length} usuario-banca relations`)
  } catch (error) {
    console.error("❌ Error seeding test data:", error)
    throw error
  }
}
