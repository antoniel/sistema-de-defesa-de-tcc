import { defineConfig, devices } from "@playwright/test"

/**
 * Configuração E2E do SISDEF.
 *
 * Decisões para evitar flake (leia antes de mudar):
 *
 * - **Portas dedicadas** (API 9100, web 5273). A suíte nunca encosta no `npm run dev`,
 *   que aponta para o PostgreSQL de desenvolvimento — que pode ter dados de produção.
 * - **`reuseExistingServer: false`**: sempre sobe servidores limpos. Se a porta estiver
 *   ocupada, o Playwright falha em vez de testar contra o servidor errado.
 * - **`retries: 0`**: retry esconde flake. Se quebrar, quebre.
 * - **Banco em memória (PGlite)** no test server: cada execução começa do seed determinístico.
 * - **Sem reset global entre specs**: as specs criam os próprios dados com identificador único,
 *   então rodam em paralelo sem interferência.
 */
const API_PORT = 9100
const WEB_PORT = 5273
const API_URL = `http://localhost:${API_PORT}`
const WEB_URL = `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: "./tests",
  /* As specs são independentes entre si: paralelismo total é seguro. */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* Sem retry — queremos ver a flake, não escondê-la. */
  retries: 0,
  /* Poucos workers: o banco de teste é um PGlite de conexão única. */
  workers: process.env.CI ? 2 : 3,
  reporter: [["list"], ["html", { open: "never" }]],
  /* Um fluxo de cadastro completo (5 passos) é demorado. */
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: WEB_URL,
    /* Diagnóstico de falha: trace, vídeo e screenshot ficam em test-results/. */
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      /* `start:test` (sem watch): um restart no meio da suíte zeraria o banco. */
      command: "cd ../../apps/server && npm run start:test",
      url: `${API_URL}/__test__/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NODE_ENV: "test", PORT: String(API_PORT) },
    },
    {
      /*
       * A suíte roda contra o BUILD DE PRODUÇÃO, não contra o dev server.
       *
       * O dev server do Vite re-otimiza dependências quando descobre algo novo, o que
       * invalida os chunks e recarrega a página. Com cache frio (CI) e workers em paralelo
       * isso derrubava a hidratação com "Cannot read properties of null (reading 'useState')".
       * Buildar custa ~5s, elimina essa classe de flake e ainda valida que o build funciona.
       *
       * `VITE_API_URL` precisa estar definida AQUI: o Vite a inlina em tempo de build.
       */
      command: "npm run build && npm run start",
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { VITE_API_URL: API_URL, PORT: String(WEB_PORT) },
    },
  ],
})

export { API_URL, WEB_URL }
