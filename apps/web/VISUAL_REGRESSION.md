# Visual Regression Testing

Este sistema permite detectar automaticamente mudanças visuais nas telas da aplicação através de screenshots comparativos.

## Como Funciona

1. **Baseline Screenshots**: Screenshots de referência das telas principais
2. **Comparison**: Comparação automática entre baseline e screenshots atuais  
3. **Diff Generation**: Geração de imagens destacando as diferenças
4. **PR Integration**: Comentários automáticos nos PRs com os resultados

## Comandos Disponíveis

### Desenvolvimento Local

```bash
# Gerar screenshots baseline (primeira vez)
npm run visual:baseline

# Comparar screenshots atuais com baseline
npm run visual:compare

# Atualizar baseline com novos screenshots
npm run visual:update

# Gerar relatório de diferenças
npm run visual:diff

# Executar apenas testes visuais
npm run visual:test
```

### Estrutura de Arquivos

```
apps/web/
├── tests/
│   ├── visual-regression.spec.ts    # Testes de regressão visual
│   ├── utils/visual-helpers.ts      # Utilitários para testes visuais
│   ├── visual-baseline/             # Screenshots de referência
│   └── .gitignore                   # Ignora arquivos temporários
├── scripts/visual-baseline.ts       # Script de gerenciamento
└── test-results/                    # Resultados dos testes (ignorado)
```

## Workflow no GitHub Actions

### Automático nos PRs

Quando você cria um PR que modifica arquivos da web ou server:

1. ✅ **Setup**: Instala dependências e inicia ambiente
2. 📥 **Download**: Baixa baseline da branch main  
3. 🧪 **Test**: Executa testes visuais
4. 📊 **Report**: Gera relatório de diferenças
5. 💬 **Comment**: Comenta no PR com resultados
6. 📤 **Upload**: Faz upload dos artifacts

### Resultado no PR

O bot comentará automaticamente com:

```markdown
## 📸 Visual Regression Test Results

❌ **3 visual differences detected**

### Changed Screenshots:
- `homepage-full`
- `login-page`  
- `navigation`

### How to Review:
1. Download the `visual-test-results-chromium` artifact
2. Extract and open `test-results/` directory
3. For each diff:
   - `*-expected.png` = baseline (current main branch)
   - `*-actual.png` = your changes
   - `*-diff.png` = highlighted differences

### Next Steps:
- If changes are **intentional**: Update baselines with `npm run visual:update`
- If changes are **unintentional**: Fix the visual issues
```

## Como Revisar Mudanças Visuais

### 1. Download do Artifact

No PR, vá na aba "Checks" → "Visual Regression Tests" → Download "visual-test-results-chromium"

### 2. Análise das Imagens

Para cada mudança, você terá 3 arquivos:
- `homepage-expected.png` - Como estava antes (baseline)
- `homepage-actual.png` - Como está agora (suas mudanças)  
- `homepage-diff.png` - Diferenças destacadas em vermelho

### 3. Decisão

**Se as mudanças são intencionais:**
```bash
npm run visual:update
git add tests/visual-baseline/
git commit -m "update visual baselines for homepage redesign"
```

**Se as mudanças são bugs:**
Corrija o CSS/componente e faça novo push. O bot testará novamente.

## Configurando Novos Testes

### Adicionando uma Nova Tela

```typescript
test("Nova tela visual regression", async ({ page }) => {
  const visual = createVisualHelper(page, "nova-tela")
  
  // Navegar para a nova tela
  await page.goto("/nova-rota")
  
  // Aguardar carregamento e esconder conteúdo dinâmico
  await visual.waitForStableState()
  await visual.hideDynamicContent()
  
  // Capturar screenshot
  await visual.compareScreenshot("completa", { fullPage: true })
})
```

### Testando Componente Específico

```typescript
test("Botão states visual regression", async ({ page }) => {
  const visual = createVisualHelper(page, "botao")
  
  await page.goto("/")
  const button = page.locator(".meu-botao")
  
  // Estado normal
  await visual.compareElement(".meu-botao", "normal")
  
  // Estado hover
  await button.hover()
  await visual.compareElement(".meu-botao", "hover")
  
  // Estado disabled
  await button.evaluate(el => el.setAttribute("disabled", "true"))
  await visual.compareElement(".meu-botao", "disabled")
})
```

### Responsive Testing

```typescript
test("Responsive visual regression", async ({ page }) => {
  const visual = createVisualHelper(page, "responsive")
  
  await page.goto("/")
  await visual.hideDynamicContent()
  
  // Testa automaticamente mobile, tablet e desktop
  await visual.compareResponsive("homepage", { fullPage: true })
})
```

## Configurações Avançadas

### playwright.config.ts

```typescript
expect: {
  // Threshold para diferenças aceitáveis (0.1 = 10%)
  threshold: 0.1,
  
  toHaveScreenshot: {
    mode: "css",              // Modo de rendering
    caret: "hide",           // Esconder cursor
    animations: "disabled",   // Desabilitar animações
  },
  
  toMatchSnapshot: {
    threshold: 0.1,           // Tolerância de diferença
    maxDiffPixels: 1000,     // Máximo de pixels diferentes
  },
}
```

### Escondendo Conteúdo Dinâmico

```typescript
await visual.hideDynamicContent() // Esconde timestamps, IDs randômicos, etc.
```

### Configuração de Viewports

```typescript
const breakpoints = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1920, height: 1080 },
]
```

## Troubleshooting

### "No baseline found"
```bash
npm run visual:baseline  # Gera novos baselines
```

### "Too many differences"
```bash
# Ajustar threshold no playwright.config.ts
threshold: 0.2  # Mais tolerante (era 0.1)
```

### "Flaky tests"
```bash
# Adicionar mais espera para estabilizar
await visual.waitForStableState()
await page.waitForTimeout(500)  # Espera adicional
```

### Screenshots inconsistentes
```bash
# Verificar se conteúdo dinâmico foi escondido
await visual.hideDynamicContent()

# Ou esconder manualmente
await page.addStyleTag({
  content: `.minha-classe { visibility: hidden !important; }`
})
```

## Melhores Práticas

### ✅ Do
- Use `visual.hideDynamicContent()` sempre
- Teste estados diferentes (normal, hover, error)
- Mantenha baselines atualizados
- Teste responsividade
- Use nomes descritivos para screenshots

### ❌ Don't  
- Commite arquivos em `test-results/`
- Ignore mudanças visuais sem revisar
- Teste telas com dados que mudam constantemente
- Use animações nos testes
- Gere baselines em ambientes diferentes

## Integração com CI/CD

O sistema já está configurado para:
- 🔄 Executar automaticamente em todos os PRs
- 📤 Fazer upload dos resultados como artifacts  
- 💬 Comentar automaticamente no PR
- 📊 Gerar relatórios detalhados
- 🏷️ Marcar builds como failed se há diferenças

Para mais detalhes, veja `.github/workflows/visual-regression.yml`.