// Configurações para testes de segurança
export const SECURITY_TEST_CONFIG = {
  // Timeouts para testes
  timeouts: {
    authentication: 5000,
    authorization: 3000,
    validation: 2000,
    attackPrevention: 4000,
  },

  // Dados de teste para usuários
  testUsers: {
    admin: {
      email: "admin@example.com",
      password: "Admin123!",
      role: "ADMIN" as const,
      nome: "Admin User",
      school: "Admin School",
      academicTitle: "PhD",
      matricula: "ADM001",
    },
    teacher: {
      email: "teacher@example.com",
      password: "Teacher123!",
      role: "TEACHER" as const,
      nome: "Teacher User",
      school: "Teacher School",
      academicTitle: "PhD",
      matricula: "TCH001",
    },
    student: {
      email: "student@example.com",
      password: "Student123!",
      role: "STUDENT" as const,
      nome: "Student User",
      school: "Student School",
      academicTitle: "MSc",
      matricula: "STD001",
    },
    anotherStudent: {
      email: "anotherstudent@example.com",
      password: "Student123!",
      role: "STUDENT" as const,
      nome: "Another Student",
      school: "Student School",
      academicTitle: "MSc",
      matricula: "STD002",
    },
  },

  // Endpoints protegidos por role
  protectedEndpoints: {
    adminOnly: [
      { path: "usuario.all", method: "get" },
      { path: "usuario.1", method: "put" },
      { path: "usuario.1", method: "delete" },
      { path: "banca.1", method: "put" },
    ],
    teacherAndAdmin: [
      { path: "usuario", method: "post" },
      { path: "banca.1", method: "delete" },
      { path: "banca.1.toggle-visibility", method: "patch" },
      { path: "banca.my-defenses", method: "get" },
    ],
    public: [
      { path: "banca", method: "get" },
      { path: "banca.1", method: "get" },
      { path: "auth.login", method: "post" },
      { path: "auth.register", method: "post" },
    ],
  },

  // Dados maliciosos para testes
  maliciousData: {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; DELETE FROM users; --",
      "'; UPDATE users SET role='ADMIN'; --",
    ],
    xss: [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:alert('xss')",
      "<iframe src=javascript:alert('xss')></iframe>",
    ],
    noSqlInjection: [
      '{"$where": "1==1"}',
      '{"$ne": null}',
      '{"$gt": ""}',
    ],
    commandInjection: [
      "; rm -rf /",
      "| cat /etc/passwd",
      "&& whoami",
      "; ls -la",
    ],
  },

  // Headers malformados para testes
  malformedHeaders: [
    "Bearer",
    "Bearer ",
    "Basic token",
    "InvalidScheme token",
    "Bearer invalid.token.here",
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
  ],

  // Dados de validação para testes
  validationData: {
    invalidEmails: [
      "not-an-email",
      "test@",
      "@example.com",
      "test..test@example.com",
      "test@example..com",
    ],
    invalidPasswords: [
      "123", // too short
      "password", // no uppercase
      "PASSWORD", // no lowercase
      "Password", // no number
      "Password1", // no special char
    ],
    validPasswords: [
      "Password123!",
      "SecurePass1@",
      "MyP@ssw0rd",
      "Str0ng#Pass",
    ],
  },

  // Configurações de rate limiting
  rateLimiting: {
    maxAttempts: 5,
    windowMs: 60000, // 1 minuto
    delayMs: 1000, // 1 segundo entre tentativas
  },

  // Configurações de auditoria
  audit: {
    enabled: true,
    logLevel: "info",
    sensitiveEndpoints: [
      "/usuario/all",
      "/usuario/:id",
      "/banca/:id",
    ],
  },

  // Configurações de segurança
  security: {
    jwtExpiration: "24h",
    passwordMinLength: 6,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 300000, // 5 minutos
  },

  // Mensagens de erro esperadas
  expectedErrors: {
    authentication: {
      noToken: "Unauthorized",
      invalidToken: "Unauthorized",
      expiredToken: "Unauthorized",
    },
    authorization: {
      insufficientRole: "Usuário não tem permissão para acessar esta rota",
      userNotFound: "Usuário não encontrado",
    },
    validation: {
      invalidEmail: "Email inválido",
      invalidPassword: "Senha deve ter pelo menos 6 caracteres",
      requiredField: "Campo obrigatório",
    },
  },

  // Configurações de teste de performance
  performance: {
    maxResponseTime: 2000, // 2 segundos
    concurrentRequests: 10,
    loadTestDuration: 30000, // 30 segundos
  },
}

// Tipos para configuração
export type TestUser = {
  email: string
  password: string
  role: "ADMIN" | "TEACHER" | "STUDENT"
  nome: string
  school: string
  academicTitle: string
  matricula: string
}
export type UserRole = TestUser["role"]
export type ProtectedEndpoint = {
  path: string
  method: string
}

// Funções utilitárias para testes
export const createTestUser = (role: keyof typeof SECURITY_TEST_CONFIG.testUsers, customData?: Partial<TestUser>): TestUser => {
  const baseUser = SECURITY_TEST_CONFIG.testUsers[role]
  return { ...baseUser, ...customData }
}

export const isEndpointProtected = (path: string, method: string): boolean => {
  const allProtected = [
    ...SECURITY_TEST_CONFIG.protectedEndpoints.adminOnly,
    ...SECURITY_TEST_CONFIG.protectedEndpoints.teacherAndAdmin,
  ]
  
  return allProtected.some(endpoint => 
    endpoint.path === path && endpoint.method.toLowerCase() === method.toLowerCase()
  )
}

export const getRequiredRoles = (path: string, method: string): UserRole[] => {
  const adminOnly = SECURITY_TEST_CONFIG.protectedEndpoints.adminOnly
  const teacherAndAdmin = SECURITY_TEST_CONFIG.protectedEndpoints.teacherAndAdmin
  
  if (adminOnly.some(endpoint => endpoint.path === path && endpoint.method === method)) {
    return ["ADMIN" as UserRole]
  }
  
  if (teacherAndAdmin.some(endpoint => endpoint.path === path && endpoint.method === method)) {
    return ["ADMIN" as UserRole, "TEACHER" as UserRole]
  }
  
  return []
}

export const generateMaliciousPayload = (type: keyof typeof SECURITY_TEST_CONFIG.maliciousData) => {
  const payloads = SECURITY_TEST_CONFIG.maliciousData[type]
  return payloads[Math.floor(Math.random() * payloads.length)]
}

export const validateSecurityHeaders = (headers: Record<string, string>): boolean => {
  const requiredHeaders = [
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
  ]
  
  return requiredHeaders.every(header => 
    Object.keys(headers).some(key => key.toLowerCase() === header)
  )
}