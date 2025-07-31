# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo containing an academic thesis committee ("banca") management system with the following structure:

- **Root**: Turborepo workspace with shared scripts and deployment tools
- **apps/web**: React Router v7 frontend with TypeScript, TailwindCSS, and Radix UI components
- **apps/server**: Hono API server with TypeScript, Drizzle ORM, and PostgreSQL
- **apps/frontend-old**: Legacy frontend (deprecated)
- **apps/yii2-organizacao-de-defesas**: Legacy PHP/Yii2 application (deprecated)
- **packages/tests**: Shared test utilities and fixtures

## Development Commands

### Root Level Commands

- `npm run dev` - Start both frontend and backend in development mode
- `npm run tscheck` - Run TypeScript type checking across all workspaces
- `npm run test` - Run all tests with TUI interface
- `npm run test:e2e` - Run end-to-end tests for web app
- `npm run deploy` - Run deployment script

### Database Management

- `npm run docker:up` - Start PostgreSQL database container
- `npm run docker:down` - Stop database container
- `npm run docker:clean` - Stop database container and remove volumes
- `npm run docker:connect` - Connect to PostgreSQL database via psql

### Frontend (apps/web)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run Playwright tests with UI
- `npm run test:headed` - Run Playwright tests with headed browser
- `npm run test:debug` - Run Playwright tests in debug mode
- `npm run test:report` - Show Playwright test report
- `npm run tscheck` - Type checking with React Router typegen

### Backend (apps/server)

- `npm run dev` - Start development server with hot reload
- `npm run dev:test` - Start test server for E2E tests
- `npm run test` - Run Vitest unit tests
- `npm run seed` - Seed database with test data
- `npm run tscheck` - TypeScript type checking
- `npm run migration:gen` - Generate Drizzle migrations
- `npm run migration:run` - Run pending migrations
- `npm run db:push` - Push schema changes to database

## Technology Stack

Import Patterns: This codebase uses @/imports, not ~/ imports

### Frontend

- **Framework**: React Router v7 with SSR
- **Styling**: TailwindCSS v4 with Radix UI primitives
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Testing**: Playwright for E2E tests
- **HTTP Client**: Hono RPC client for type-safe API calls
- **UI Components**: Extensive Radix UI component library
- **Notifications**: Sonner for toast notifications

### Backend

- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with bcryptjs
- **Email**: Nodemailer for notifications
- **Testing**: Vitest for unit tests, PGlite for test database
- **Error Handling**: ts-pattern for exhaustive error matching
- **Validation**: Zod schemas with Hono zValidator

### Database Schema

See `apps/server/src/database/schema.ts` for complete schema definitions. Key entities: Users, Cursos, Bancas, Teacher Invitations, Password Reset, Documents, Sessions, and relationship tables.

## Architecture Notes

### Module Structure

The server follows a modular architecture in `apps/server/src/modules/`:

- `auth/` - Authentication and authorization (JWT middleware)
- `banca/` - Thesis committee management with full CRUD operations
- `usuario/` - User management and profile operations
- `curso/` - Academic program management
- `teacher-invitation/` - Teacher invitation system with secure hash validation
- `calendar/` - Calendar integration
- `documento/` - Document handling and file management

### Database Configuration

- Uses Drizzle ORM with PostgreSQL for production
- Migrations are auto-generated and version-controlled in `apps/server/src/database/drizzle/`
- Connection configured via `DATABASE_URL` environment variable
- Test database uses PGlite for faster test execution
- Schema defined in `apps/server/src/database/schema.ts` with full type safety
- Database seeding available through `npm run seed`

### Testing Strategy

- Unit tests for business logic using Vitest
- E2E tests using Playwright that start both frontend and backend
- Test server runs on separate port with `npm run dev:test`
- Database seeding available for consistent test data
- Test fixtures in `packages/tests/src/fixtures/`
- Shared test utilities in `packages/tests/src/utils/`

## Environment Setup

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - Frontend URL for email links (default: http://localhost:5173)
- Email configuration:
  - `SMTP_USER` - Gmail username for sending emails
  - `SMTP_PASSWORD` - Gmail app password for authentication
  - `NODE_ENV` - Use "production" for real email sending, otherwise uses Ethereal test emails

## Deployment

The project includes deployment scripts and Docker configurations:

- `npm run deploy` - Runs deployment script (`scripts/deploy.ts`)
- Separate production branches for web and server
- `npm run sync` - Syncs production branches with main
- `npm run push:web` - Deploys web app to Dokku
- `npm run push:server` - Deploys server to Dokku
- Docker Compose for local development database

## API Client Pattern

### Frontend-Backend Communication

The project uses Hono's RPC client for type-safe API communication:

- **Client Setup**: `apps/web/app/services/apiClient.ts` - Hono RPC client with automatic JWT token headers
- **Mutations**: `apps/web/app/services/authService.ts` - TanStack Query mutations for API calls
- **Pattern**: Always use mutations (not fetch) for API calls to maintain consistency and type safety

### Example API Usage

```typescript
// ✅ Correct - Use mutations
const loginMutation = useLoginMutation()
loginMutation.mutate({ json: { email, password } })

// ❌ Incorrect - Don't use fetch directly
fetch('/api/auth/login', { method: 'POST', ... })
```

## Email System

### Email Service Architecture

- **Service**: `apps/server/src/services/email.service.ts`
- **Templates**: HTML email templates with responsive design
- **Development**: Uses Ethereal email for testing (check console for preview URLs)
- **Production**: Uses Gmail SMTP with app passwords

### Email Features

- **Teacher Invitations**: Secure hash-based invitations with 7-day expiration
- **Password Reset**: Secure token-based reset with 1-hour expiration
- **Templates**: Professional HTML templates with proper styling

## Security Features

### Password Reset Flow

1. User requests reset via email
2. System generates secure token (expires in 1 hour)
3. Email sent with reset link
4. User clicks link, enters new password
5. Token validated and consumed (single-use)
6. Password updated and token cleaned up

### Teacher Invitation Flow

1. Admin creates invitation with email and name
2. System generates secure hash (expires in 7 days)
3. Email sent with invitation link
4. Teacher clicks link, completes registration
5. Hash validated and marked as used
6. Teacher account created with TEACHER role

## Code Conventions

### File Structure & Naming

- Use **kebab-case** for file names: `user-service.ts`, `password-reset.tsx`
- Use **PascalCase** for React components: `LoginForm.tsx`, `PasswordResetPage.tsx`
- Use **camelCase** for functions and variables: `requestPasswordReset`, `isLoading`
- Use **SCREAMING_SNAKE_CASE** for constants: `JWT_SECRET`, `AUTH_TOKEN_KEY`

### Backend Conventions

#### Module Structure

Each module in `apps/server/src/modules/` follows this pattern:

```
module-name/
├── module.route.ts     # Route definitions with validation
├── module.service.ts   # Business logic and database operations
├── module.schema.ts    # Zod validation schemas
├── module.test.ts      # Unit tests
```

#### Service Functions

- Always return `AppResult<T, E>` type for consistent error handling
- Use descriptive error types: `{ type: "user_not_found" | "database_error" }`
- Include `c: Context<{ Variables: AppVariables }>` as first parameter
- Use `try/catch` blocks with proper error logging

#### Route Handlers

- Use `zValidator` for input validation
- Use `match` from `ts-pattern` for error handling
- Throw `AppError` for HTTP errors
- Follow RESTful conventions

Example:

```typescript
.post("/", zValidator("json", createUserSchema), async (c) => {
  const validatedData = c.req.valid("json")
  const result = await service.createUser(c, validatedData)
  if (!result.ok) {
    throw match(result.error)
      .with({ type: "duplicate_email" }, () => new AppError(400, "Email já cadastrado"))
      .with({ type: "database_error" }, () => new AppError(500, "Erro interno"))
      .exhaustive()
  }
  return c.json(result.data, 201)
})
```

#### Database Operations

- Use Drizzle ORM with typed queries
- Always use `.limit(1)` for single record queries
- Use descriptive variable names: `existingUser`, `newInvitation`
- Include timestamps: `createdAt`, `updatedAt`
- Use transactions for multi-table operations

### Frontend Conventions

#### Component Structure

- Use function declarations for components: `export function LoginForm() {}`
- Always use explicit return statements instead of arrow function auto-returns: `function Component() { return (...) }` not `const Component = () => (...)`
- Group hooks at the top of the component
- Use TypeScript interfaces for props: `interface LoginFormProps {}`
- Use React Hook Form for form handling
- Use Zod for client-side validation

#### State Management Best Practices

- **State Colocation**: Move `useState` and `useEffect` as close as possible to the leaf components that need them
- **Avoid Prop Drilling**: Instead of passing hooks like `navigate` through props, call `useNavigate()` directly in each component that needs it
- **Local State**: Keep component state local when possible - don't lift state unnecessarily to parent components
- **Component Autonomy**: Each component should manage its own hooks and state when feasible

```typescript
// ✅ Good - State managed in the component that uses it
function ObservacoesGerais() {
  const [observacoes, setObservacoes] = useState("")
  return <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
}

// ❌ Bad - State lifted unnecessarily to parent
function Parent() {
  const [observacoes, setObservacoes] = useState("")
  return <ObservacoesGerais observacoes={observacoes} setObservacoes={setObservacoes} />
}

// ✅ Good - Each component uses its own navigate hook
function AccessDeniedMessage() {
  const navigate = useNavigate()
  return <Button onClick={() => navigate(-1)}>Voltar</Button>
}

// ❌ Bad - Passing navigate through props
function AccessDeniedMessage({ navigate }: { navigate: NavigateFunction }) {
  return <Button onClick={() => navigate(-1)}>Voltar</Button>
}
```

#### State Management

- Use TanStack Query for server state
- Use `useState` for local component state
- Use custom hooks for complex logic
- Prefix boolean states with `is`, `has`, `should`: `isLoading`, `hasError`

#### API Integration

- Always use mutations from `authService.ts`
- Never use `fetch` directly - use Hono RPC client
- Handle loading states with `isPending`
- Use `onSuccess` and `onError` callbacks

#### UI Components

- Use Radix UI primitives with custom styling
- Use `cn()` utility for conditional classes
- Use semantic HTML elements
- Include proper ARIA labels and accessibility
- Use loading states and disabled states consistently

### Database Schema Conventions

- Use **snake_case** for column names: `created_at`, `password_hash`
- Use **camelCase** for TypeScript field names: `createdAt`, `passwordHash`
- Include audit fields: `createdAt`, `updatedAt`
- Use proper foreign key relationships
- Include unique constraints where needed

### Error Handling Patterns

- Use `AppResult<T, E>` pattern for service functions
- Use `AppError` for HTTP errors
- Use `match` from `ts-pattern` for exhaustive error handling
- Include proper error logging with context
- Use toast notifications for user feedback

### Security Conventions

- Hash passwords with bcryptjs
- Use crypto.randomBytes for secure tokens
- Include token expiration for all secure operations
- Clean up expired/used tokens
- Never log sensitive information
- Use environment variables for secrets
- JWT tokens for authentication
- Secure hash validation for invitations

### Testing Conventions

- Use Vitest for unit tests
- Use Playwright for E2E tests
- Test both success and error scenarios
- Use descriptive test names
- Include setup and teardown where needed

## Development Guidelines

### Adding New API Endpoints

1. Add route in appropriate module (e.g., `apps/server/src/modules/usuario/usuario.route.ts`)
2. Add service function with proper error handling
3. Add Zod schema for validation
4. Add mutation hook in `apps/web/app/services/authService.ts`
5. Use mutation in frontend components

### Email Templates

- Use `createXxxEmail()` functions in email service
- Include proper styling with responsive design
- Add security warnings for sensitive emails
- Test with Ethereal email in development

## Reminders

- IMPORTANT - ALWAYS remember to run `npm run tscheck` at the end of some implementation

## Code Style Notes

- Avoid unnecessary type declarations when types are already inferred
- **Specific Note about Database Schemas**:
  - Stop declaring types for entities when they are already defined as Insert[Entity] or Select[Entity] in `@apps/server/src/database/schema.ts`

## Developer Tips

- **Workflow Optimization**:
  - ao invés de usar comentários com TODO, use apps/server/src/todo.ts ou apps/web/app/lib/utils.ts#TODO

## PDF Document Templates

- **Institution**: All PDF documents are for UFBA (Universidade Federal da Bahia), not UFRN
- **Format**: Based on official UFBA document templates with proper institutional headers
- **Location**: Templates located in `apps/web/app/components/pdf/`
- **Available Documents**:
  - `ata-defesa.tsx` - Defense minutes/proceedings
  - `declaracao-participacao.tsx` - Participation declaration for committee members
  - `declaracao-orientacao.tsx` - Supervision declaration for advisors
- **Styling**: Uses Times-Roman font, official UFBA formatting with proper spacing and layout
