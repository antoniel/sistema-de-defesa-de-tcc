# Rationale da Apresentação - SISDEF 3.0

### Agenda

Uma tabela mostrando qual a ideia e tals

## 1. Sistemas de Informação e Resolução de Problemas

### 1.1 O Papel dos Sistemas de Informação

- **Definição**: Sistema responsável pela coleta, processamento, análise e disseminação de informações com propósito específico
- **Objetivo**: Contribuir para tomada de decisões e suporte a processos organizacionais
- **Contexto Acadêmico**:
  - Organização e gestão de atividades
  - Agilização de processos (comunicação, cooperação, coordenação)
  - Armazenamento eficiente de dados
  - Geração de novas informações

### 1.2 O Problema: Gestão Manual de Defesas de TCC

**Cenário Tradicional:**

- Processos manuais propensos a erros humanos
- Coordenação complexa entre múltiplos atores:
  - Estudantes
  - Orientadores
  - Membros de bancas avaliadoras
  - Setores administrativos
- Baixa visibilidade dos trabalhos apresentados
- Tarefas repetitivas (geração de docs, envio de convites)
- Dificuldades na comunicação entre partes

**Gap Específico na UFBA:**

- ✅ Repositório UFBA: Armazena teses/dissertações **já defendidas**
- ❌ Lacuna: Gerenciamento do processo **PRÉ-defesa**
  - Agendamento de datas
  - Composição de bancas
  - Convite de membros
  - Registro de notas
  - Geração de documentação administrativa

### 1.3 Solução: SISDEF

**Automação através de Sistema de Informação especializado:**

- Centralização de informações de defesas
- Automatização de tarefas (geração de docs, envio de e-mails)
- Padronização de procedimentos
- Maior transparência dos dados acadêmicos
- Redução de esforço administrativo

---

## 2. Contexto e Evolução do SISDEF

### 2.1 SISDEF 1.0 (2022)

**Autor:** Gabriel Goulart Roque Macedo Santana

**Funcionalidades:**

- Cadastro de bancas por docentes
- Geração automática de formulário de avaliação
- Envio de convites por e-mail + Google Calendar
- Controle de permissões (admin/orientador/co-orientador)

**Limitações:**

- Público restrito (apenas docentes)
- Infraestrutura externa (GitHub Pages + Heroku)
- Gestão de cursos fixa no código
- Apenas 1 tipo de documento

### 2.2 SISDEF 2.0 (2023)

**Autores:** João Pedro Brito Silva, Frederico Araújo Durão

**Melhorias:**

- Inclusão de estudantes como público-alvo
- Gerenciamento dinâmico de cursos
- Pré-cadastro de docentes externos
- 3 tipos de documentos (avaliação, participação, orientação)
- Migração para infraestrutura IC-UFBA (Dokku)
- JWT para autenticação

**Limitações Técnicas Críticas:**

- ❌ **Zero testes automatizados**
- ❌ PHP/JavaScript sem tipagem estática
- ❌ Alta complexidade em controladores
- ❌ Lógica de negócio misturada com HTTP
- ❌ Erros só detectados em runtime/produção
- ❌ Barreira alta para novos desenvolvedores
- ❌ Performance frontend comprometida
- ❌ Falta de SSR (Server Side Rendering)
- ❌ Ausência de responsividade mobile
- ❌ Sem pipelines de CI/CD
- ❌ Validação de dados insuficiente
- ❌ Inconsistência de interfaces (feedback dos usuários)

---

## 3. Por que Reescrita Completa?

### 3.1 Decisão: Reescrita > Manutenção Incremental

**Análise:**

- Sistema acadêmico deve evoluir por **anos/décadas**
- Manutenções incrementais tornando-se **progressivamente custosas**
- Ponto de inflexão: adicionar features aumenta complexidade exponencialmente

**Motivações Técnicas:**

- Ausência de rede de segurança (testes) torna refatoração arriscada
- Tipagem dinâmica dificulta detecção precoce de erros
- Arquitetura não facilita extensibilidade
- DX (Developer Experience) ruim eleva barreira de entrada

**Oportunidade:**

- Ecossistema JavaScript/TypeScript maduro
- Frameworks modernos (React Router v7, Hono)
- Ferramentas de qualidade (Playwright, Vitest, Drizzle ORM)
- Momento certo para reimaginar arquitetura

### 3.2 Stack Tecnológica Moderna Escolhida

**TypeScript Full-Stack:**

- **Frontend**: React Router v7 + SSR
- **Backend**: Hono framework
- **ORM**: Drizzle (type-safe)
- **DB**: PostgreSQL
- **Testes**: Vitest (unit) + Playwright (E2E)

### 3.3 Justificativa Baseada em Dados

**Análise Comparativa de Adoção:**

| Categoria         | PHP (Packagist) | JS/TS (npm) | Diferença |
| ----------------- | --------------- | ----------- | --------- |
| Framework Backend | 71.527          | 12.455M     | **174x**  |
| ORM               | 3.476M          | 11.535M     | **3.3x**  |
| Testing           | 11.392M         | 66.088M     | **5.8x**  |

**Fonte:** Downloads mensais (outubro-novembro 2025)

**Por que isso importa?**

- ✅ **Maior pool de desenvolvedores**: Facilita encontrar colaboradores
- ✅ **Mais recursos educacionais**: Tutoriais, docs, Stack Overflow
- ✅ **Comunidade ativa**: Manutenção contínua das bibliotecas
- ✅ **Evolução constante**: Tecnologias com futuro
- ✅ **Baixa barreira de entrada**: Estudantes/pesquisadores já familiarizados

**Não são preferências pessoais, são decisões fundamentadas em dados reais de mercado.**

---

## 4. Funcionalidades Principais do SISDEF 3.0

_[Momento de DEMO/MOSTRAR o sistema funcionando com capturas de tela]_

### 4.1 Multi-Step Wizard para Criação de Bancas (Inovação)

**Problema das versões anteriores:**

- Formulário único extenso
- Sobrecarga cognitiva
- Alto índice de erros no preenchimento

**Solução - 5 Etapas Sequenciais:**

1. **Informações Básicas**

   - Título do trabalho
   - Resumo e Abstract
   - Checkbox de visibilidade pública
   - _[IMAGEM: Figura 1 do TCC - primeira etapa]_

2. **Informações do Autor**

   - Dados do discente (auto-preenchidos para alunos)
   - Seleção de orientador e coorientador
   - Autocomplete para busca de docentes
   - _[IMAGEM: Figura 2 do TCC - segunda etapa]_

3. **Avaliadores da Banca**

   - Distinção entre membros internos/externos
   - Interface dinâmica para adicionar múltiplos avaliadores
   - Suporte a convite de externos via email
   - _[IMAGEM: Figura 3 do TCC - terceira etapa]_

4. **Metadados Acadêmicos**

   - Curso (BCC/BSI)
   - Tipo de trabalho (TCC/Dissertação/Tese)
   - Palavras-chave
   - Área de concentração
   - _[IMAGEM: Figura 4 do TCC - quarta etapa]_

5. **Revisão e Confirmação**
   - Sumário consolidado de todas as informações
   - Navegação livre para etapas anteriores
   - Correções sem perda de dados
   - _[IMAGEM: Figura 5 do TCC - quinta etapa]_

**Benefícios UX:**

- ✅ Reduz carga cognitiva
- ✅ Indicador visual de progresso (círculos 1-5)
- ✅ Validação por etapa
- ✅ Sensação de avanço e controle

### 4.2 Dashboard e Visualização de Defesas

**Interface Principal:**

- Organização cronológica automática:
  - **Próximas defesas** (ordem ascendente)
  - **Defesas anteriores** (ordem descendente)
- _[IMAGEM: Figura 6 do TCC - dashboard]_

**Funcionalidades de Busca:**

- Filtro por múltiplos critérios:
  - Título do trabalho
  - Nome do discente
  - Orientador
  - Avaliador
- Paginação configurável (10/25/50 itens)
- Ordenação por múltiplas colunas (clicável)

**Informações Exibidas:**

- Data da defesa
- Título do trabalho
- Nome do discente
- Orientador
- Curso (BCC/BSI)
- Link para reunião virtual (quando aplicável)

**Melhoria vs SISDEF 2.0:**

- Busca expandida (antes: só por título)
- Densidade de informação otimizada
- Performance superior (paginação eficiente)

### 4.3 Gerenciamento Administrativo de Usuários

**Painel de Usuários:**

- _[IMAGEM: Figura 7 do TCC - gestão de usuários]_

**Funcionalidades:**

- Visualização consolidada (150 usuários)
- Filtros dinâmicos por perfil (tabs):
  - Todos
  - Administradores
  - Professores
  - Alunos
- Busca por nome/email/matrícula
- Ações administrativas (menu "..."):
  - Alteração de permissões
  - Reset de senha
  - Desativação de conta

**Convite de Professores Externos (Inovação):**

- Geração de links únicos de convite
- Pré-preenchimento automático de dados
- Email com instruções de primeiro acesso
- Onboarding simplificado
- **Impacto**: Formação rápida de bancas com externos

### 4.4 Detalhes da Banca

**Tela Consolidada:**

- _[IMAGEM: Figura 8 do TCC - detalhes de banca]_

**Agrupamento Lógico de Informações:**

- Dados básicos do trabalho (título, resumo, abstract)
- Informações do autor (nome, matrícula)
- Composição da banca (orientador, coorientador, avaliadores)
- Metadados acadêmicos (curso, tipo, palavras-chave)
- Agendamento (data, horário, local, link virtual)

**Ações Contextuais (para usuários autorizados):**

- ✏️ Edição de informações
- 📄 Geração de documentos
- 📊 Gerenciamento de notas dos avaliadores

**Princípio de Design:**

- Concentração de funcionalidades relacionadas
- Reduz navegação entre múltiplas páginas
- Otimiza eficiência em tarefas frequentes

### 4.5 Geração de Documentos PDF

**3 Tipos de Documentos (baseados em templates oficiais UFBA):**

1. **Formulário de Avaliação**
   - Para registro de notas por cada avaliador
   - Pré-preenchido com dados da banca
2. **Declaração de Participação**
   - Para membros da banca
   - Comprovação de atuação como avaliador
3. **Declaração de Orientação**
   - Para orientadores
   - Comprovação de orientação do trabalho

**Características:**

- Font: Times-Roman (padrão UFBA)
- Cabeçalho institucional oficial
- Formatação padronizada
- Geração sob demanda (quantas vezes necessário)

**Impacto:**

- Elimina tarefa altamente repetitiva
- Reduz erros humanos no preenchimento
- Economiza tempo de docentes com múltiplos orientandos

### 4.6 Perfil Self-Service

**Autonomia dos Usuários:**

- _[IMAGEM: Figura 9 do TCC - perfil do usuário]_

**Funcionalidades:**

- Visualização de dados pessoais
- Edição sem intervenção administrativa:
  - Nome completo
  - Email institucional
  - Matrícula
  - Titulação acadêmica (professores)
  - Área de atuação (professores)

**Validação Dupla:**

- Frontend: Feedback imediato (mensagens de erro)
- Backend: Garantia de integridade de dados

**Benefícios:**

- Reduz carga sobre administradores
- Aumenta autonomia dos usuários
- Dados sempre atualizados

### 4.7 Gerenciamento Dinâmico de Cursos

**Problema do SISDEF 1.0/2.0:**

- Lista de cursos fixa no código
- Adicionar curso = alterar código-fonte

**Solução SISDEF 3.0:**

- Interface administrativa para CRUD de cursos
- Campos: nome, sigla, status (ativo/inativo)
- Listagem tabular com operações de edição/exclusão

**Impacto:**

- Separação entre configuração e código
- Adaptável a outros departamentos UFBA
- Reusabilidade da solução
- Zero necessidade de deploy para adicionar curso

---

## 5. Arquitetura e Contribuições Técnicas

### 5.1 Arquitetura Modular por Domínio

**Organização baseada em Domain-Driven Design:**

```
modules/
  auth/       # Autenticação e autorização
  banca/      # Gerenciamento de bancas
  usuario/    # Gerenciamento de usuários
  curso/      # Gerenciamento de cursos
  documento/  # Geração de documentos
```

**Cada módulo contém:**

- `*.route.ts` - Endpoints HTTP + validação de entrada
- `*.service.ts` - Lógica de negócio isolada
- `*.schema.ts` - Schemas Zod para validação
- `*.test.ts` - Testes unitários

**Benefícios Arquiteturais:**

- ✅ **Alta coesão**: Código relacionado junto
- ✅ **Baixo acoplamento**: Módulos independentes
- ✅ **Testabilidade**: Testes isolados por módulo
- ✅ **Escalabilidade de equipe**: Múltiplos devs, diferentes módulos

### 5.2 Type Safety End-to-End (Contribuição Principal)

**Problema no SISDEF 2.0:**

- Erros de contrato entre frontend/backend só descobertos em runtime
- Mudanças no backend quebram frontend silenciosamente
- Debugging difícil e demorado

**Solução - Hono RPC Client:**

```typescript
// Backend define tipos
app.post("/bancas", zValidator("json", bancaSchema), (c) => {
  return c.json({ id: 1, titulo: "..." })
})

// Frontend importa tipos automaticamente
const client = hc<AppType>("/api")
const response = await client.bancas.$post({ json: dados })
//    ^ TypeScript sabe exatamente o formato esperado
```

**Impactos:**

- ✅ Contratos validados em **compile-time**
- ✅ Autocompletar completo no frontend
- ✅ Refatoração segura (erros aparecem no editor)
- ✅ **Elimina classe inteira de erros**

**Exemplo real:**

- Se backend adiciona campo obrigatório `abstract`
- TypeScript imediatamente sinaliza erro em todas as chamadas
- Correção antes de executar o código

### 5.3 Suíte Completa de Testes (Contribuição Principal)

**Contexto:**

- SISDEF 1.0 e 2.0: **Zero testes automatizados**
- Refatorações = arriscadas
- Regressões descobertas em produção

**Estratégia de Testes do SISDEF 3.0:**

#### Testes Unitários (Vitest)

**Foco:** Lógica de negócio isolada

```typescript
// Exemplo: Testa service de autenticação
test("deve gerar JWT válido", () => {
  const token = generateJWT({ userId: 1, role: "STUDENT" })
  expect(decodeJWT(token)).toMatchObject({ userId: 1 })
})
```

**Características:**

- Execução rápida (JIT TypeScript)
- Service layers testadas sem HTTP/DB
- Watch mode inteligente (re-executa apenas afetados)

#### Testes End-to-End (Playwright)

**Foco:** Fluxos críticos completos

- ✅ Cadastro e autenticação
- ✅ Criação de banca (multi-step completo)
- ✅ Edição de banca
- ✅ Geração de documentos PDF
- ✅ Convite de professores externos

**Características:**

- Múltiplos navegadores (Chromium, Firefox, WebKit)
- Banco de teste isolado (PGlite - in-memory PostgreSQL)
- Trace viewer para debugging de falhas
- Geração automática de screenshots

**Impactos:**

- ✅ **Rede de segurança para refatorações**
- ✅ **Confiança em deploys**: Se passa nos testes, funciona
- ✅ **Documentação viva**: Testes descrevem comportamento esperado
- ✅ **Detecção precoce de bugs**: Antes de chegar em produção

### 5.4 Processo de Migração Documentado

**Desafio:** MySQL → PostgreSQL com dados existentes

**Etapas:**

1. **Exportação completa** via `mysqldump`
2. **Adaptação de schema:**
   - Tipos incompatíveis (TINYINT → BOOLEAN)
   - Timestamps (timezone handling)
   - Auto-increment → SERIAL
3. **Transformação de dados:**
   - Normalização de relacionamentos
   - Decomposição de campos concatenados
   - Criação de chaves estrangeiras
4. **Validação:**
   - Integridade referencial
   - Contagem de registros
   - Testes manuais de funcionalidades críticas

**Contribuição:**

- Referência para projetos similares
- Scripts reutilizáveis
- Lições aprendidas documentadas

---

## 6. Validação: Métricas de Adoção Real

### 6.1 Base de Usuários

- **Total**: 150 usuários ativos
- **Estudantes**: 94 (62,7%)
- **Professores**: 14 (9,3%)
- **Administradores**: 42 (28,0%)

**Distribuição reflete adequadamente a população-alvo:**

- Predominância de estudantes (público principal)
- 42 administradores = corpo docente IC-UFBA com permissões de gestão
- Gestão descentralizada por área de concentração

### 6.2 Atividade de Bancas

- **Total**: 58 bancas cadastradas
- **Realizadas**: 56 (96,6%)
- **Futuras**: 2 (3,4%)
- **Distribuição**: 72,4% BCC | 27,6% BSI

**Insights:**

- Alta taxa de bancas já realizadas (96,6%)
- Sistema usado predominantemente para **registro e documentação**
- Cadastro prospectivo ainda limitado (oportunidade de crescimento)

### 6.3 Participações Registradas

- **Total**: 124 participações individuais
- **Avaliadores externos**: 60 (48,4%)
- **Orientadores**: 51 (41,1%)
- **Alunos defendentes**: 13 (10,5%)

**Análise:**

- Predominância de avaliadores evidencia uso efetivo para **gestão de membros externos**
- Sistema cumpre objetivo de facilitar convite e registro de bancas
- Múltiplas participações por pessoa (professores em várias bancas)

### 6.4 Conclusão das Métricas

**Validação de Adoção Efetiva:**

- ✅ 150 usuários ativos = substituição de processos manuais
- ✅ 58 bancas gerenciadas = utilização consistente
- ✅ Sistema em **produção real** no IC-UFBA
- ✅ Dados demonstram que o sistema **está sendo usado** conforme projetado

---

## 7. Impacto e Diferencial

### 7.1 Antes vs Depois

**SISDEF 2.0:**

- ❌ Código frágil sem testes
- ❌ Erros descobertos em produção
- ❌ Refatoração arriscada
- ❌ Difícil adicionar features
- ❌ Alta barreira para novos devs

**SISDEF 3.0:**

- ✅ Type safety → bugs em dev time
- ✅ Testes E2E → confiança em deploys
- ✅ Arquitetura modular → fácil manutenção
- ✅ Stack popular → baixa barreira entrada
- ✅ DX superior → colaboração facilitada

### 7.2 Foco em Qualidade de Software

- **Manutenibilidade**: Código limpo, modular
- **Testabilidade**: Cobertura unit + E2E
- **Developer Experience**: Setup simples, feedback rápido
- **Sustentabilidade**: Tecnologias com futuro

**Não foi apenas modernização tecnológica:**

- Foi **reengenharia arquitetural** focada em sustentabilidade
- Decisões baseadas em **dados**, não preferências pessoais
- Investimento em **qualidade** para ganhos de longo prazo

---

## 8. Conclusão e Trabalhos Futuros

### 8.1 Objetivos Alcançados

- ✅ Preservou todas funcionalidades existentes
- ✅ Estabeleceu base sólida para evolução
- ✅ Adoção efetiva comprovada (150 usuários, 58 bancas)
- ✅ Infraestrutura de testes completa
- ✅ Arquitetura modular e type-safe

### 8.2 Próximos Passos

- Integração com Repositório UFBA (fluxo completo)
- Busca avançada e filtros aprimorados
- Relatórios e estatísticas para coordenadores
- Expansão para outros departamentos UFBA
- Refinamentos baseados em feedback contínuo

### 8.3 Mensagem Central

> **"Não foi apenas modernização tecnológica, foi reengenharia arquitetural focada em sustentabilidade a longo prazo através de qualidade, testabilidade e baixa barreira de entrada."**

**Modelo para Sistemas Acadêmicos:**

- Decisão entre evolução incremental vs reescrita completa
- Investimento em arquitetura sólida se justifica
- Práticas modernas de engenharia de software
- Ganhos de manutenibilidade a longo prazo

---

## Questões Não Resolvidas

_[Esta seção será preenchida conforme você for expandindo os pontos]_

---

## Notas de Apresentação

**Tempo sugerido por seção:**

1. Sistemas e Problema (2-3 min)
2. Contexto e Evolução SISDEF 1.0 e 2.0 (2-3 min)
3. **Por que Reescrita Completa? + Stack Moderna + Justificativa com Dados** (3-4 min) 📊
4. **Funcionalidades Principais com DEMO/IMAGENS** (4-5 min) ⭐
5. **Arquitetura e Contribuições Técnicas** (Type Safety + Testes + Migração) (4-5 min) 🏗️
6. Métricas de Validação e Adoção Real (2-3 min)
7. Impacto (1-2 min)
8. Conclusão (1-2 min)

**Total**: 19-29 minutos (ajustar conforme tempo disponível)

**Fluxo narrativo otimizado:**

1. **Contexto** → Problema → Evolução histórica
2. **Decisão crítica** → Por que reescrever? → Qual stack? → Por que essa stack? (dados)
3. **Demonstração** → Como ficou o sistema? (DEMO com imagens)
4. **Fundação técnica** → Como foi construído? (Arquitetura + Type Safety + Testes)
5. **Validação** → Está sendo usado? (Métricas reais)
6. **Fechamento** → Impacto + Lições + Futuro

**Notas importantes:**

- Seção 3: Apresentar **dados concretos** (tabela npm vs Packagist) para justificar escolhas
- Seção 4: **DEMO visual** - usar Figuras 1-9 do TCC
- Seção 5: Enfatizar **contribuições técnicas principais** (type safety e testes = diferenciais)
- Transição fluida: "Por que reescrever?" → "O que escolhemos?" → "Como ficou?" → "Como funciona?" → "Está funcionando?"
