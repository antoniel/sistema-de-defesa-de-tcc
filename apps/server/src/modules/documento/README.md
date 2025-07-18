# Sistema de Geração de Documentos

Este módulo implementa a geração automática de documentos PDF para o sistema de bancas acadêmicas.

## Funcionalidades Implementadas

### 1. Ata de Defesa
- **Endpoint**: `POST /api/documentos/gerar/:bancaId`
- **Descrição**: Gera a ata oficial da defesa de TCC
- **Acesso**: Membros da banca e ADMINs
- **Conteúdo**:
  - Informações da banca e do trabalho
  - Composição completa da banca
  - Resultado da avaliação
  - Espaço para assinaturas

### 2. Declaração de Participação
- **Endpoint**: `GET /api/documentos/participacao/:bancaId`
- **Descrição**: Gera declaração de participação em banca examinadora
- **Acesso**: Próprio membro da banca e ADMINs
- **Conteúdo**:
  - Certificado de participação
  - Dados do membro e da banca
  - Composição da banca (destacando o membro)

### 3. Declaração de Orientação
- **Endpoint**: `GET /api/documentos/orientacao/:bancaId`
- **Descrição**: Gera declaração de orientação/coorientação
- **Acesso**: Orientadores/coorientadores e ADMINs
- **Conteúdo**:
  - Certificado de orientação
  - Dados do orientador e orientando
  - Informações completas do trabalho

### 4. Informações da Banca
- **Endpoint**: `GET /api/documentos/info/:bancaId`
- **Descrição**: Retorna dados estruturados da banca
- **Acesso**: TEACHERs e ADMINs
- **Conteúdo**: JSON com todas as informações necessárias

## Arquitetura

### Componentes Principais

1. **documento.route.ts**: Definição das rotas e validações
2. **documento.service.ts**: Lógica de negócio e orquestração
3. **document.service.ts**: Serviços core (PDF, queries, validações)
4. **Templates**: Geração de HTML para cada tipo de documento

### Fluxo de Geração

1. **Autenticação**: Verificação de JWT token
2. **Autorização**: Validação de role e acesso à banca
3. **Busca de Dados**: Query das informações da banca
4. **Geração HTML**: Aplicação do template apropriado
5. **Geração PDF**: Conversão HTML → PDF via Puppeteer
6. **Resposta**: Retorno do PDF como download

### Controle de Acesso

#### Ata de Defesa
- ✅ Qualquer membro da banca
- ✅ Administradores

#### Declaração de Participação
- ✅ Próprio membro da banca
- ✅ Administradores

#### Declaração de Orientação
- ✅ Orientadores (role: "orientador")
- ✅ Coorientadores (role: "coorientador")
- ✅ Administradores

## Tecnologias Utilizadas

- **Puppeteer**: Geração de PDF a partir de HTML
- **Hono**: Framework web para as rotas
- **Drizzle ORM**: Queries ao banco de dados
- **Zod**: Validação de schemas
- **TypeScript**: Tipagem forte e segurança

## Estrutura dos Templates

### Base Template
- Layout HTML comum para todos os documentos
- Estilos CSS para impressão
- Variáveis substituíveis ({{title}}, {{content}}, etc.)

### Templates Específicos
- **ata-defesa.template.ts**: Layout da ata oficial
- **declaracao-participacao.template.ts**: Layout da declaração de participação
- **declaracao-orientacao.template.ts**: Layout da declaração de orientação

## Exemplo de Uso

```typescript
// Gerar ata de defesa
const response = await fetch('/api/documentos/gerar/1', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <jwt-token>'
  }
})

const pdfBlob = await response.blob()
// PDF será baixado automaticamente
```

## Configuração de Desenvolvimento

### Dependências
```bash
npm install puppeteer @hono/zod-validator
```

### Testes
```bash
npm test src/modules/documento/documento.test.ts
```

## Segurança

- **JWT Authentication**: Todos os endpoints protegidos
- **Role-based Access**: Controle granular por tipo de documento
- **Relationship Validation**: Verificação de vínculo usuário-banca
- **Input Validation**: Validação rigorosa de parâmetros

## Monitoramento

- **Logs**: Todos os erros são logados com contexto
- **Error Handling**: Tratamento exhaustivo de cenários de erro
- **Type Safety**: TypeScript garante consistência dos tipos

## Limitações Conhecidas

1. **Performance**: Geração de PDF pode ser lenta para documentos grandes
2. **Memória**: Puppeteer consome recursos significativos
3. **Concorrência**: Múltiplas gerações simultâneas podem sobrecarregar o sistema

## Melhorias Futuras

- [ ] Cache de templates compilados
- [ ] Geração assíncrona com queue
- [ ] Assinaturas digitais
- [ ] Watermarks de segurança
- [ ] Templates personalizáveis por instituição