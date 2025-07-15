# Visual Regression Testing

Este projeto inclui um sistema completo de testes de regressão visual usando Playwright. O sistema automaticamente detecta mudanças visuais nas interfaces e gera relatórios detalhados com comparações lado a lado.

## 🎯 Visão Geral

O sistema de visual regression testing:
- ✅ Captura screenshots automaticamente das páginas principais
- ✅ Compara com imagens baseline anteriores
- ✅ Gera diffs visuais quando há mudanças
- ✅ Cria relatórios HTML detalhados
- ✅ Integra com GitHub Actions para PRs
- ✅ Suporta múltiplos viewports (mobile, tablet, desktop)

## 🚀 Início Rápido

### 1. Configuração Inicial

```bash
# No diretório raiz do projeto
./scripts/visual-testing.sh init
```

### 2. Criar Baselines Iniciais

```bash
# Captura screenshots iniciais (baselines)
./scripts/visual-testing.sh update
```

### 3. Executar Testes Visuais

```bash
# Executa testes e gera relatório
./scripts/visual-testing.sh test
```

## 📁 Estrutura de Arquivos

```
apps/web/
├── tests/
│   ├── visual-regression.spec.ts    # Testes de regressão visual
│   └── utils/
│       ├── visual-helpers.ts        # Helpers para screenshots
│       └── image-diff.ts           # Comparação de imagens
├── test-results/
│   ├── baseline/                   # Screenshots de referência
│   ├── current/                    # Screenshots atuais
│   ├── diff/                       # Imagens de diferença
│   ├── reports/                    # Relatórios HTML
│   └── screenshots/                # Screenshots dos testes
└── scripts/
    └── generate-visual-report.js   # Gerador de relatórios
```

## 🛠️ Comandos Disponíveis

### Scripts NPM

```bash
# Executa apenas testes visuais
npm run test:visual

# Atualiza screenshots baseline
npm run test:visual:update

# Gera relatório de comparação
npm run test:visual:report
```

### Script Helper

```bash
# Inicializar setup
./scripts/visual-testing.sh init

# Executar testes
./scripts/visual-testing.sh test

# Atualizar baselines
./scripts/visual-testing.sh update

# Comparar apenas
./scripts/visual-testing.sh compare

# Limpar artifacts
./scripts/visual-testing.sh clean

# Ajuda
./scripts/visual-testing.sh help
```

## 📸 Escrevendo Testes Visuais

### Teste Básico de Página

```typescript
import { test, expect } from "@playwright/test"
import { takePageScreenshot, VIEWPORTS } from "./utils/visual-helpers"

test("página inicial", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop)
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  
  await takePageScreenshot(page, "home-page.png")
})
```

### Teste de Componente

```typescript
test("componente de navegação", async ({ page }) => {
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  
  await takeComponentScreenshot(
    page, 
    "nav", 
    "navigation-component.png"
  )
})
```

### Teste Responsivo

```typescript
test("responsividade", async ({ page }) => {
  await takeResponsiveScreenshots(page, "home", "/")
})
```

### Configurações Avançadas

```typescript
test("página com mascaramento", async ({ page }) => {
  await page.goto("/")
  
  await takePageScreenshot(page, "masked-page.png", {
    mask: [".timestamp", ".loading-spinner"],
    threshold: 0.1,
    fullPage: true
  })
})
```

## 🔧 Configuração

### Playwright Config

A configuração está em `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... outras configurações
  
  // Visual comparison configuration
  expect: {
    threshold: 0.2,
    toMatchSnapshot: {
      mode: "precise",
      threshold: 0.2,
    },
  },
  
  // Visual testing output directory
  outputDir: "./test-results/screenshots",
})
```

### Threshold de Diferença

- **0.1**: Muito sensível (detecta pequenas mudanças)
- **0.2**: Padrão (balance entre sensibilidade e ruído)
- **0.5**: Menos sensível (apenas mudanças significativas)

## 🤖 Integração GitHub Actions

### Workflow Automático

O sistema roda automaticamente em PRs:

1. **Trigger**: PRs para `main` que modificam arquivos relevantes
2. **Execução**: Roda testes visuais no ambiente CI
3. **Comparação**: Compara com baselines existentes
4. **Relatório**: Comenta no PR com resultados
5. **Artifacts**: Upload de screenshots e relatórios

### Atualizando Baselines via CI

Use o workflow manual "Update Visual Baselines":

1. Vá para Actions → Update Visual Baselines
2. Clique em "Run workflow"
3. Escolha a branch
4. Execute

### Comentários Automáticos no PR

O bot comenta automaticamente no PR com:
- ✅ Status dos testes (passou/falhou)
- 📊 Número de mudanças detectadas
- 🔗 Links para artifacts e relatórios
- 🛠️ Instruções para próximos passos

## 📊 Relatórios

### Relatório HTML

O relatório gerado inclui:
- **Resumo**: Total de testes, passou/falhou
- **Comparações**: Baseline vs Atual vs Diff
- **Métricas**: Porcentagem de diferença por pixel
- **Interativo**: Navegação fácil entre resultados

### Estrutura do Relatório

```html
📊 Summary Cards
├── Total Tests: 10
├── Passed: 8
├── Failed: 2
└── Errors: 0

🔍 Detailed Results
├── Test 1: home-page ✅
├── Test 2: login-page ❌ (2.3% diff)
│   ├── Baseline Image
│   ├── Current Image
│   └── Diff Highlight
└── ...
```

## 🐛 Troubleshooting

### Testes Falhando Sempre

**Problema**: Diferenças em elementos dinâmicos (timestamps, animações)

**Solução**: Use mascaramento

```typescript
await takePageScreenshot(page, "test.png", {
  mask: [".timestamp", "[data-testid='loading']"]
})
```

### Baseline Não Encontrada

**Problema**: `No baseline found for screenshot.png`

**Solução**: 
```bash
./scripts/visual-testing.sh update
git add test-results/
git commit -m "chore: add visual baselines"
```

### Diferenças Inconsistentes

**Problema**: Testes passam localmente mas falham no CI

**Solução**: 
1. Verifique fontes e renderização
2. Use `waitForLoadState("networkidle")`
3. Adicione `waitForTimeout()` se necessário
4. Considere usar Docker para ambiente consistente

### Performance

**Problema**: Testes muito lentos

**Solução**:
1. Use `screenshot: "only-on-failure"` no Playwright config
2. Limite o número de viewports testados
3. Execute testes visuais em paralelo com `--workers`

## 🎨 Boas Práticas

### 1. Nomeação Consistente

```typescript
// ✅ Bom
"home-page-desktop.png"
"login-form-mobile.png"
"navigation-component.png"

// ❌ Evitar
"test1.png"
"screenshot.png"
"img_001.png"
```

### 2. Aguardar Carregamento

```typescript
// ✅ Aguardar conteúdo carregar
await page.goto("/")
await page.waitForLoadState("networkidle")
await waitForAnimations(page)

// ❌ Screenshot imediato
await page.goto("/")
await expect(page).toHaveScreenshot()
```

### 3. Mascarar Elementos Dinâmicos

```typescript
// ✅ Mascarar elementos que mudam
await takePageScreenshot(page, "test.png", {
  mask: [
    ".timestamp",
    ".loading-spinner", 
    "[data-testid='random-data']"
  ]
})
```

### 4. Viewports Consistentes

```typescript
// ✅ Usar viewports padronizados
await page.setViewportSize(VIEWPORTS.desktop)

// ❌ Viewports aleatórios
await page.setViewportSize({ width: 1234, height: 567 })
```

### 5. Organização de Testes

```typescript
test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
  })

  test.describe("Pages", () => {
    test("home page", async ({ page }) => { ... })
    test("about page", async ({ page }) => { ... })
  })

  test.describe("Components", () => {
    test("navigation", async ({ page }) => { ... })
    test("footer", async ({ page }) => { ... })
  })
})
```

## 📚 Recursos Adicionais

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-screenshots)
- [Best Practices for Visual Testing](https://playwright.dev/docs/best-practices)
- [CI/CD Integration Guide](https://playwright.dev/docs/ci-intro)

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique este README
2. Execute `./scripts/visual-testing.sh help`
3. Consulte os logs no GitHub Actions
4. Verifique issues conhecidos no repositório