import { describe, expect, it, beforeEach, vi } from "vitest"
import { createMiddleware } from "hono/factory"
import { checkRole, appJwt } from "../modules/auth/auth.middleware"
import { type UserRole } from "../database/schema"
import { AppError } from "../error"

// Mock do contexto Hono
const createMockContext = (jwtPayload?: any, user?: any) => {
  const context = {
    get: vi.fn((key: string) => {
      if (key === "jwtPayload") return jwtPayload
      return undefined
    }),
    set: vi.fn(),
    req: {
      raw: {
        headers: {
          get: vi.fn((header: string) => {
            if (header === "Authorization") {
              return jwtPayload ? `Bearer mock-token` : undefined
            }
            return undefined
          }),
        },
      },
      url: "http://localhost:3000/test",
    },
  }
  return context
}

// Mock do serviço de usuário
const mockGetUserById = vi.fn()

vi.mock("../modules/usuario/usuario.service", () => ({
  getUserById: mockGetUserById,
}))

describe("Auth Middleware Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("checkRole Middleware", () => {
    it("should throw error when user ID is not provided", async () => {
      const context = createMockContext() // No JWT payload
      const next = vi.fn()

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow(AppError)
      await expect(middleware(context as any, next)).rejects.toThrow("ID do usuário não fornecido")
    })

    it("should throw error when user is not found", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: false,
        error: { type: "user_not_found" },
      })

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow(AppError)
      await expect(middleware(context as any, next)).rejects.toThrow("Usuário não encontrado")
    })

    it("should throw error when user has insufficient role", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: true,
        data: { role: "STUDENT" },
      })

      const middleware = checkRole(["ADMIN", "TEACHER"])
      
      await expect(middleware(context as any, next)).rejects.toThrow(AppError)
      await expect(middleware(context as any, next)).rejects.toThrow("Usuário não tem permissão para acessar esta rota")
    })

    it("should allow access when user has sufficient role", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: true,
        data: { role: "ADMIN" },
      })

      const middleware = checkRole(["ADMIN", "TEACHER"])
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it("should handle database errors gracefully", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: false,
        error: { type: "database_error" },
      })

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow(AppError)
      await expect(middleware(context as any, next)).rejects.toThrow("Erro ao buscar usuário")
    })
  })

  describe("appJwt Middleware", () => {
    it("should continue without token when no authorization header", async () => {
      const context = createMockContext()
      const next = vi.fn()

      const middleware = appJwt({ secret: "test-secret" })
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
      expect(context.set).not.toHaveBeenCalled()
    })

    it("should continue without token when authorization header is malformed", async () => {
      const context = createMockContext()
      const next = vi.fn()

      // Mock malformed header
      context.req.raw.headers.get.mockReturnValue("InvalidHeader")

      const middleware = appJwt({ secret: "test-secret" })
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
      expect(context.set).not.toHaveBeenCalled()
    })

    it("should continue without token when JWT verification fails", async () => {
      const context = createMockContext()
      const next = vi.fn()

      // Mock valid header but invalid token
      context.req.raw.headers.get.mockReturnValue("Bearer invalid-token")

      const middleware = appJwt({ secret: "test-secret" })
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
      expect(context.set).not.toHaveBeenCalled()
    })

    it("should set JWT payload when token is valid", async () => {
      const context = createMockContext()
      const next = vi.fn()

      // Mock valid header and token
      context.req.raw.headers.get.mockReturnValue("Bearer valid-token")

      // Mock successful JWT verification
      const mockPayload = { sub: "123", role: "ADMIN" }
      
      // Mock the JWT verify function
      const originalVerify = await import("hono/jwt")
      vi.spyOn(originalVerify, "verify").mockResolvedValue(mockPayload)

      const middleware = appJwt({ secret: "test-secret" })
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
      expect(context.set).toHaveBeenCalledWith("jwtPayload", mockPayload)
    })
  })

  describe("Role-based Access Control Scenarios", () => {
    const createRoleTest = (userRole: UserRole, requiredRoles: UserRole[], shouldAllow: boolean) => {
      it(`should ${shouldAllow ? "allow" : "deny"} ${userRole} access to ${requiredRoles.join(", ")} endpoints`, async () => {
        const context = createMockContext({ sub: "123" })
        const next = vi.fn()

        mockGetUserById.mockResolvedValue({
          ok: true,
          data: { role: userRole },
        })

        const middleware = checkRole(requiredRoles)
        
        if (shouldAllow) {
          await expect(middleware(context as any, next)).resolves.toBeUndefined()
          expect(next).toHaveBeenCalled()
        } else {
          await expect(middleware(context as any, next)).rejects.toThrow("Usuário não tem permissão para acessar esta rota")
          expect(next).not.toHaveBeenCalled()
        }
      })
    }

    // Test all role combinations
    createRoleTest("STUDENT", ["STUDENT"], true)
    createRoleTest("STUDENT", ["TEACHER"], false)
    createRoleTest("STUDENT", ["ADMIN"], false)
    createRoleTest("STUDENT", ["TEACHER", "ADMIN"], false)
    
    createRoleTest("TEACHER", ["STUDENT"], false)
    createRoleTest("TEACHER", ["TEACHER"], true)
    createRoleTest("TEACHER", ["ADMIN"], false)
    createRoleTest("TEACHER", ["TEACHER", "ADMIN"], true)
    
    createRoleTest("ADMIN", ["STUDENT"], false)
    createRoleTest("ADMIN", ["TEACHER"], false)
    createRoleTest("ADMIN", ["ADMIN"], true)
    createRoleTest("ADMIN", ["TEACHER", "ADMIN"], true)
  })

  describe("Security Edge Cases", () => {
    it("should handle null/undefined JWT payload gracefully", async () => {
      const context = createMockContext(null)
      const next = vi.fn()

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow("ID do usuário não fornecido")
    })

    it("should handle empty string user ID", async () => {
      const context = createMockContext({ sub: "" })
      const next = vi.fn()

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow("ID do usuário não fornecido")
    })

    it("should handle non-numeric user ID", async () => {
      const context = createMockContext({ sub: "invalid-id" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: false,
        error: { type: "user_not_found" },
      })

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).rejects.toThrow("Usuário não encontrado")
    })

    it("should handle case-sensitive role comparison", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: true,
        data: { role: "admin" }, // lowercase
      })

      const middleware = checkRole(["ADMIN"]) // uppercase
      
      await expect(middleware(context as any, next)).rejects.toThrow("Usuário não tem permissão para acessar esta rota")
    })
  })

  describe("Middleware Integration Tests", () => {
    it("should work with multiple role requirements", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: true,
        data: { role: "TEACHER" },
      })

      const middleware = checkRole(["ADMIN", "TEACHER"])
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it("should work with single role requirement", async () => {
      const context = createMockContext({ sub: "123" })
      const next = vi.fn()

      mockGetUserById.mockResolvedValue({
        ok: true,
        data: { role: "ADMIN" },
      })

      const middleware = checkRole(["ADMIN"])
      
      await expect(middleware(context as any, next)).resolves.toBeUndefined()
      expect(next).toHaveBeenCalled()
    })
  })
})