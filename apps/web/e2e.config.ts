import type { E2EConfig } from 'e2e'
import { web } from '@e2e-dev/web'
import { opencodeConsole } from 'e2e/oauth/opencode-console'

export default {
  // OpenCode Go: cada passo de agente é cobrado pela assinatura Go do usuário.
  // Passos verificados de agent.act são replayados do cache (.e2e/cache/,
  // COMMITADO no git) sem chamar o modelo — só regenera quando a UI muda.
  agents: {
    default: {
      model: opencodeConsole('go/deepseek-v4.1-flash'),
      system: 'Você é um agente QA minucioso. Verifique cada resultado na tela antes de prosseguir.',
    },
  },
  // Grava vídeo de cada tentativa em .e2e/results/<teste>/attempt-<n>/.
  // Não entra no cache key — ligar/desligar não invalida replays.
  video: 'on',
  targets: [{
    engine: web(),
    app: {
      url: process.env.APP_URL ?? 'http://localhost:5173',
    },
  }],
} satisfies E2EConfig
