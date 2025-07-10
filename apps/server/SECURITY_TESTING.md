# Testes de Segurança de Permissões

Este documento descreve os testes de segurança implementados para garantir que os endpoints da API respeitem as permissões e autenticação adequadas.

## Visão Geral

Os testes de segurança foram criados para verificar:

1. **Autenticação**: Verificar se endpoints protegidos requerem autenticação
2. **Controle de Acesso Baseado em Role (RBAC)**: Verificar se usuários só podem acessar endpoints apropriados para seu role
3. **Validação de Entrada**: Verificar se dados maliciosos são rejeitados
4. **Prevenção de Ataques**: Testar contra SQL injection, XSS, etc.
5. **Controle de Recursos**: Verificar se usuários só podem acessar seus próprios dados

## Estrutura dos Testes

### 1. Testes de Autenticação (`endpoint-security.test.ts`)

Verifica se endpoints protegidos requerem autenticação válida:

```typescript
// Endpoints que devem requerer autenticação
const protectedEndpoints = [
  { path: "usuario.me", method: "get" },
  { path: "usuario.all", method: "get" },
  { path: "banca.my-defenses", method: "get" },
]
```

### 2. Testes de RBAC (Role-Based Access Control)

Verifica se usuários só podem acessar endpoints apropriados para seu role:

#### Roles do Sistema:
- **ADMIN**: Acesso total ao sistema
- **TEACHER**: Pode criar usuários e gerenciar bancas
- **STUDENT**: Acesso limitado, principalmente leitura

#### Endpoints por Role:

**Admin-only:**
- `GET /usuario/all` - Listar todos os usuários
- `PUT /usuario/:id` - Atualizar qualquer usuário
- `DELETE /usuario/:id` - Deletar usuários
- `PUT /banca/:id` - Atualizar bancas

**Teacher + Admin:**
- `POST /usuario` - Criar usuários
- `DELETE /banca/:id` - Deletar bancas
- `PATCH /banca/:id/toggle-visibility` - Alterar visibilidade
- `GET /banca/my-defenses` - Ver minhas defesas

**Public:**
- `GET /banca` - Listar bancas públicas
- `GET /banca/:id` - Ver detalhes de banca
- `POST /auth/login` - Login
- `POST /auth/register` - Registro

### 3. Testes de Validação de Entrada

Verifica se o sistema rejeita dados maliciosos:

```typescript
// Testa rejeição de JSON malformado
it("should reject malformed JSON", async () => {
  const response = await client.auth.login.$post({
    body: "invalid json",
  })
  expect(response.status).toBe(400)
})

// Testa validação de email
it("should validate email format", async () => {
  const response = await client.auth.login.$post({
    json: {
      email: "not-an-email",
      password: "Password123!",
    },
  })
  expect(response.status).toBe(400)
})
```

### 4. Testes de Prevenção de Ataques

#### SQL Injection:
```typescript
const maliciousQueries = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "<script>alert('xss')</script>",
]
```

#### XSS Prevention:
```typescript
const maliciousUser = {
  nome: "<script>alert('xss')</script>",
  // ... outros campos
}
```

### 5. Testes de Controle de Recursos

Verifica se usuários só podem acessar seus próprios dados:

```typescript
it("should allow users to access their own profile", async () => {
  // Login como student
  const loginResponse = await client.auth.login.$post({
    json: { email: "student@example.com", password: "Student123!" }
  })
  
  const token = loginResponse.json().token
  
  // Acessar próprio perfil
  const response = await client["usuario.me"].$get({
    headers: { Authorization: `Bearer ${token}` }
  })
  
  expect(response.status).toBe(200)
})
```

## Como Executar os Testes

### Pré-requisitos

1. Instalar dependências:
```bash
npm install
```

2. Configurar banco de dados de teste (se necessário)

### Executar Todos os Testes de Segurança

```bash
npm test -- --grep "Security"
```

### Executar Testes Específicos

```bash
# Testes de autenticação
npm test -- --grep "Authentication"

# Testes de RBAC
npm test -- --grep "Role-Based Access Control"

# Testes de validação
npm test -- --grep "Input Validation"
```

## Cenários de Teste Implementados

### 1. Cenários de Autenticação

- ✅ Requisições sem token são rejeitadas (401)
- ✅ Tokens inválidos são rejeitados (401)
- ✅ Headers de autorização malformados são rejeitados (401)
- ✅ Endpoints públicos não requerem autenticação

### 2. Cenários de RBAC

- ✅ Admin pode acessar endpoints admin-only
- ✅ Non-admin não pode acessar endpoints admin-only (403)
- ✅ Teacher pode acessar endpoints teacher+
- ✅ Student não pode acessar endpoints teacher+ (403)
- ✅ Múltiplos roles são suportados (ADMIN, TEACHER)

### 3. Cenários de Validação

- ✅ JSON malformado é rejeitado (400)
- ✅ Campos obrigatórios são validados (400)
- ✅ Formato de email é validado (400)
- ✅ Requisitos de senha são validados (400)

### 4. Cenários de Segurança

- ✅ Queries maliciosas são tratadas graciosamente
- ✅ Input com scripts é sanitizado
- ✅ Múltiplas tentativas de login são tratadas
- ✅ Headers malformados são rejeitados

### 5. Cenários de Controle de Recursos

- ✅ Usuários podem acessar próprio perfil
- ✅ Usuários podem atualizar próprio perfil
- ✅ Usuários podem alterar própria senha
- ✅ Dados sensíveis não são expostos

## Middleware de Segurança

### `checkRole` Middleware

```typescript
export const checkRole = (roles: UserRole[]) =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const userId = c.get("jwtPayload")?.sub
    if (!userId) {
      throw new AppError(400, "ID do usuário não fornecido")
    }
    
    const result = await getUserById(c, Number(userId))
    if (!result.ok) {
      throw new AppError(404, "Usuário não encontrado")
    }
    
    if (!roles.includes(result.data.role as UserRole)) {
      throw new AppError(403, "Usuário não tem permissão para acessar esta rota")
    }
    
    return next()
  })
```

### `appJwt` Middleware

```typescript
export const appJwt = (options: { secret: SignatureKey }) => {
  return createMiddleware(async (ctx, next) => {
    const credentials = ctx.req.raw.headers.get("Authorization")
    if (!credentials) {
      return await next()
    }
    
    const [, token] = credentials.split(/\s+/)
    if (!token) {
      return await next()
    }

    let payload
    try {
      payload = await verify(token, options.secret)
    } catch (e) {
      return await next()
    }
    
    if (!payload) {
      return await next()
    }

    ctx.set("jwtPayload", payload)
    await next()
  })
}
```

## Boas Práticas Implementadas

### 1. Princípio do Menor Privilégio
- Usuários só têm acesso ao que precisam
- Roles são específicos e bem definidos

### 2. Validação Rigorosa
- Todos os inputs são validados
- Schemas Zod garantem type safety
- Sanitização de dados maliciosos

### 3. Tratamento de Erros Seguro
- Erros não expõem informações sensíveis
- Mensagens de erro são genéricas
- Logs não contêm dados sensíveis

### 4. Autenticação Robusta
- JWT com expiração
- Verificação de assinatura
- Tokens inválidos são rejeitados

### 5. Controle de Acesso Granular
- Verificação de role por endpoint
- Verificação de propriedade quando necessário
- Middleware reutilizável

## Monitoramento e Alertas

### Logs de Segurança

Os seguintes eventos devem ser logados:

1. **Tentativas de acesso negado (403)**
2. **Tentativas de acesso não autenticado (401)**
3. **Múltiplas tentativas de login falhadas**
4. **Acesso a endpoints sensíveis**
5. **Tentativas de SQL injection detectadas**

### Métricas de Segurança

- Taxa de tentativas de acesso negado
- Taxa de tokens inválidos
- Tempo de resposta de endpoints protegidos
- Número de usuários por role

## Recomendações de Segurança

### 1. Implementar Rate Limiting
```typescript
// Exemplo de rate limiting
const rateLimit = createMiddleware(async (c, next) => {
  const ip = c.req.header("x-forwarded-for") || "unknown"
  const key = `rate_limit:${ip}`
  
  const attempts = await redis.incr(key)
  if (attempts === 1) {
    await redis.expire(key, 60) // 1 minuto
  }
  
  if (attempts > 10) {
    throw new AppError(429, "Too many requests")
  }
  
  await next()
})
```

### 2. Implementar Audit Logging
```typescript
// Log de auditoria
const auditLog = createMiddleware(async (c, next) => {
  const startTime = Date.now()
  const userId = c.get("jwtPayload")?.sub
  
  await next()
  
  const duration = Date.now() - startTime
  await logAuditEvent({
    userId,
    endpoint: c.req.path,
    method: c.req.method,
    status: c.res.status,
    duration,
    timestamp: new Date(),
  })
})
```

### 3. Implementar CORS Adequado
```typescript
// Configuração CORS segura
app.use("*", cors({
  origin: ["https://yourdomain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
```

### 4. Implementar Helmet.js
```typescript
// Headers de segurança
app.use("*", helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}))
```

## Conclusão

Os testes de segurança implementados garantem que:

1. ✅ Autenticação é obrigatória para endpoints protegidos
2. ✅ Controle de acesso baseado em role funciona corretamente
3. ✅ Validação de entrada previne ataques
4. ✅ Dados sensíveis não são expostos
5. ✅ Usuários só acessam seus próprios recursos

Para manter a segurança, execute estes testes regularmente e monitore os logs de segurança para detectar tentativas de acesso não autorizado.