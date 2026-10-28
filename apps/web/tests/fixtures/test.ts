import { expect, request, test as base, type APIRequestContext, type Browser, type Page } from "@playwright/test"
import { E2E_ACCOUNTS, E2E_CREDENTIALS, E2E_PASSWORD } from "@tcc/tests"

/**
 * Fixtures do E2E.
 *
 * Princípios:
 * - **Autenticação por API + `storageState`**: o token vai direto pro `localStorage`,
 *   então cada spec começa logada sem clicar em formulário. Um único spec (`auth.spec.ts`)
 *   exercita o login pela interface.
 * - **Dados por spec**: `unique` gera um identificador por teste. Specs criam as próprias
 *   entidades (aluno, banca) via API em vez de consumir o seed, então rodam em paralelo
 *   e podem repetir (`--repeat-each`) sem colidir.
 * - **`reuseExistingServer: false`** no config garante que estamos no servidor de teste.
 */

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:9100"
export const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:5273"

/** Chave do token no `localStorage` — igual a `AUTH_TOKEN_KEY` do app. */
const TOKEN_KEY = "authToken"

export interface CreatedUser {
  id: number
  email: string
  nome: string
  matricula: string
  password: string
}

export interface CreatedBanca {
  id: number
  tituloTrabalho: string
}

type Role = keyof typeof E2E_CREDENTIALS

interface E2EFixtures {
  /** Cliente HTTP apontando para a API de teste. */
  api: APIRequestContext
  /** Token do admin, para montar cenários via API. */
  adminToken: string
  /** Sufixo único por teste, para e-mails/matrículas/títulos. */
  unique: string
  /** Página já autenticada como ADMIN. */
  asAdmin: Page
  /** Página já autenticada como TEACHER (orientador do seed). */
  asTeacher: Page
  /** Página autenticada como outro TEACHER do seed — NÃO é orientador da banca 1. */
  asTeacher2: Page
  /** Página já autenticada como STUDENT (aluno sem banca). */
  asStudent: Page
  /** Helpers de criação de dados. */
  factory: Factory
}

export interface Factory {
  login(role: Role): Promise<string>
  createStudent(overrides?: Partial<CreatedUser>): Promise<CreatedUser>
  createTeacher(overrides?: Partial<CreatedUser>): Promise<CreatedUser>
  createBanca(input: {
    alunoId: number
    orientadorId: number
    cursoId?: number
    tituloTrabalho?: string
    linkTrabalho?: string | null
    avaliadorId?: number
    /** Nome do aluno autor — por padrão é derivado do sufixo único. */
    autor?: string
  }): Promise<CreatedBanca>
}

/** Espera o backend estar realmente pronto (não só a porta aberta). */
async function waitForApi(): Promise<void> {
  const ctx = await request.newContext({ baseURL: API_URL })
  const deadline = Date.now() + 30_000
  let lastError: unknown = null
  while (Date.now() < deadline) {
    try {
      const res = await ctx.get("/__test__/health")
      if (res.ok()) {
        const body = (await res.json()) as { env?: string }
        if (body.env !== "test") {
          throw new Error(`A API em ${API_URL} não é o test server (env=${body.env}). Abortando.`)
        }
        await ctx.dispose()
        return
      }
    } catch (error) {
      lastError = error
      if (error instanceof Error && error.message.includes("não é o test server")) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  await ctx.dispose()
  throw new Error(`API de teste não respondeu em ${API_URL}: ${String(lastError)}`)
}

export const test = base.extend<E2EFixtures>({
  api: async ({}, use) => {
    await waitForApi()
    const ctx = await request.newContext({ baseURL: API_URL })
    await use(ctx)
    await ctx.dispose()
  },

  unique: async ({}, use, testInfo) => {
    const slug = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32)
    await use(`${slug}-${testInfo.workerIndex}-${Date.now().toString(36)}`)
  },

  adminToken: async ({ api }, use) => {
    const res = await api.post("/auth/login", { data: E2E_CREDENTIALS.admin })
    expect(res.ok(), "login do admin do seed falhou").toBeTruthy()
    const { token } = (await res.json()) as { token: string }
    await use(token)
  },

  factory: async ({ api, adminToken, unique }, use) => {
    const authHeader = { Authorization: `Bearer ${adminToken}` }
    /* Contador por teste: cada `createStudent()` precisa de um e-mail próprio. */
    let createdCount = 0

    const createUser = async (role: "STUDENT" | "TEACHER", overrides?: Partial<CreatedUser>): Promise<CreatedUser> => {
      const password = E2E_PASSWORD
      const suffix = `${unique}-${createdCount++}`
      const email = overrides?.email ?? `${role.toLowerCase()}.${suffix}@e2e.local`
      const matricula = overrides?.matricula ?? `M${suffix}`.slice(0, 20)
      const res = await api.post("/usuario", {
        headers: authHeader,
        data: {
          email,
          password,
          nome: overrides?.nome ?? `Usuário ${role} ${unique}`,
          role,
          matricula,
          school: "Instituto de Computação",
          academicTitle: "Graduando",
        },
      })
      expect(res.ok(), `criação de ${role} falhou: ${res.status()} ${await res.text()}`).toBeTruthy()
      const created = (await res.json()) as { id: number; email: string; nome: string; matricula: string }
      return { ...created, password }
    }

    const factory: Factory = {
      async login(role) {
        const res = await api.post("/auth/login", { data: E2E_CREDENTIALS[role] })
        expect(res.ok(), `login de ${role} falhou`).toBeTruthy()
        return ((await res.json()) as { token: string }).token
      },

      createStudent: (overrides) => createUser("STUDENT", overrides),
      createTeacher: (overrides) => createUser("TEACHER", overrides),

      async createBanca({ alunoId, orientadorId, cursoId = 1, tituloTrabalho, linkTrabalho, avaliadorId, autor }) {
        const titulo = tituloTrabalho ?? `Banca E2E ${unique}`
        /* O form de edição exige ao menos um avaliador, então a banca criada aqui também tem. */
        const avaliador = avaliadorId ?? E2E_ACCOUNTS.teacher2.id
        const res = await api.post("/banca", {
          headers: authHeader,
          data: {
            tituloTrabalho: titulo,
            palavrasChave: "e2e, teste",
            cursoId,
            resumo: "Resumo criado pelo E2E.",
            abstract: "Abstract created by E2E.",
            alunoId,
            dataRealizacao: new Date("2099-01-10T13:00:00.000Z").toISOString(),
            local: "https://meet.google.com/e2e-fixture",
            orientadorId,
            autor: autor ?? `Autor ${unique}`,
            matricula: `M${unique}`.slice(0, 20),
            turma: "GICC0002 PROJETO FINAL DE CURSO II",
            periodoAcademico: "2026.1",
            modalidade: "remoto",
            visible: true,
            membros: [{ id: orientadorId }, { id: avaliador }],
            ...(linkTrabalho === undefined ? {} : { linkTrabalho }),
          },
        })
        expect(res.ok(), `criação de banca falhou: ${res.status()} ${await res.text()}`).toBeTruthy()
        const created = (await res.json()) as { id: number; tituloTrabalho: string }
        return created
      },
    }

    // `createUser` é interno; expõe só os atalhos públicos.
    const exposed: Factory = {
      login: factory.login,
      createStudent: factory.createStudent,
      createTeacher: factory.createTeacher,
      createBanca: factory.createBanca,
    }
    await use(exposed)
  },

  asAdmin: async ({ browser, factory }, use) => {
    await useWithToken(browser, await factory.login("admin"), use)
  },
  asTeacher: async ({ browser, factory }, use) => {
    await useWithToken(browser, await factory.login("teacher"), use)
  },
  asTeacher2: async ({ browser, factory }, use) => {
    await useWithToken(browser, await factory.login("teacher2"), use)
  },
  asStudent: async ({ browser, factory }, use) => {
    await useWithToken(browser, await factory.login("freeStudent"), use)
  },
})

async function useWithToken(browser: Browser, token: string, use: (page: Page) => Promise<void>) {
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [{ origin: WEB_URL, localStorage: [{ name: TOKEN_KEY, value: token }] }],
    },
  })
  const page = await context.newPage()
  try {
    await use(page)
  } finally {
    await context.close()
  }
}

export { expect }
