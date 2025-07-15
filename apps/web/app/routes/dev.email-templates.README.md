# 📧 Email Templates Preview Page

Esta página permite visualizar os templates de email do sistema durante o desenvolvimento.

## 🚀 Como acessar

### 1. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

### 2. Acesse com conta de administrador

- Faça login com uma conta que tenha role `ADMIN`
- No cabeçalho, clique no menu do usuário (dropdown)
- Clique em "Email Templates (Dev)" (só aparece em desenvolvimento)

### 3. Ou acesse diretamente

Navegue para: `http://localhost:5173/dev/email-templates`

## 🎨 Funcionalidades

### Templates Disponíveis

- **🎓 Convite para Professor**: Template para convites de professores
- **🔒 Recuperação de Senha**: Template para reset de senha

### Ações Disponíveis

- **Ver Preview**: Abre modal com preview do template
- **Baixar HTML**: Baixa o template como arquivo HTML

## 🔒 Segurança

- **Só funciona em desenvolvimento**: Página só carrega quando `NODE_ENV === 'development'`
- **Retorna 404 em produção**: Em produção, mostra página de erro 404
- **Dados fictícios**: Usa dados de exemplo para demonstração

## 📱 Responsivo

A página funciona bem em:
- Desktop (visualização completa)
- Tablet (grade responsiva)
- Mobile (layout adaptado)

## 🔧 Personalização

Para adicionar novos templates:

1. Adicione o template em `apps/web/app/lib/email-templates.ts`
2. Adicione entrada no array `templates` em `dev.email-templates.tsx`
3. Configure título, descrição e variant apropriados

## 🎨 Design System

Os templates utilizam as cores do design system:
- **Primária**: `#1a1a1a` (convites padrão)
- **Destrutiva**: `#dc2626` (ações críticas como reset de senha)
- **Cores consistentes**: Alinhadas com `apps/web/app/app.css`

## 📝 Exemplo de uso

```typescript
// Template de convite
createTeacherInvitationEmail({
  nome: 'Prof. João Silva',
  invitationUrl: 'https://sistema-banca.com/teacher-invitation/accept?token=...'
})

// Template de reset de senha
createPasswordResetEmail({
  nome: 'Maria Santos',
  resetUrl: 'https://sistema-banca.com/reset-password?token=...'
})
```