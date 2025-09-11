import { eq } from "drizzle-orm"
import { testClient } from "hono/testing"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { app } from "../.."
import { Users } from "../../database/schema"
import { fakeDeps, getFakeDb } from "../../tests/utils"
import { TEST_ADMIN, TEST_STUDENT, createTestUserWithPasswordHash } from "@tcc/tests"

describe("Usuario Routes", async () => {
  const db = await getFakeDb()
  const client = testClient(app(fakeDeps(db)))

  let adminToken: string
  let testStudent: any

  beforeEach(async () => {
    // Create admin user for authentication
    const adminUser = await createTestUserWithPasswordHash(TEST_ADMIN)
    await db.insert(Users).values(adminUser)

    // Create test student to update
    testStudent = await createTestUserWithPasswordHash(TEST_STUDENT)
    await db.insert(Users).values(testStudent)

    // Login as admin to get token
    const loginResponse = await client.auth.login.$post({
      json: {
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
      },
    })
    const loginData = await loginResponse.json()
    adminToken = loginData.token
  })

  afterEach(async () => {
    await db.delete(Users)
  })

  it("should update user role from STUDENT to TEACHER", async () => {
    // First, verify the user is currently a STUDENT
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    expect(userBefore[0].role).toBe("STUDENT")

    // Update the user's role to TEACHER
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudent.nome,
        school: testStudent.school,
        academicTitle: testStudent.academicTitle,
        role: "TEACHER" as const,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the response contains the updated role
    expect(updatedData.role).toBe("TEACHER")

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("TEACHER")
  })

  it("should update user role from STUDENT to ADMIN", async () => {
    // First, verify the user is currently a STUDENT
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    expect(userBefore[0].role).toBe("STUDENT")

    // Update the user's role to ADMIN
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: testStudent.nome,
        school: testStudent.school,
        academicTitle: testStudent.academicTitle,
        role: "ADMIN" as const,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the response contains the updated role
    expect(updatedData.role).toBe("ADMIN")

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].role).toBe("ADMIN")
  })

  it("should update other user fields without affecting role", async () => {
    const userBefore = await db.select().from(Users).where(eq(Users.email, TEST_STUDENT.email)).limit(1)
    const originalRole = userBefore[0].role

    // Update other fields but keep the same role
    const updateResponse = await client.usuario[":id"].$put({
      param: { id: userBefore[0].id.toString() },
      json: {
        nome: "Updated Name",
        school: "Updated School",
        academicTitle: "Updated Title",
        role: originalRole,
      },
    }, { headers: { Authorization: `Bearer ${adminToken}` } })

    expect(updateResponse.status).toBe(200)
    
    const updatedData = await updateResponse.json()
    
    // Verify the fields were updated
    expect(updatedData.nome).toBe("Updated Name")
    expect(updatedData.school).toBe("Updated School")
    expect(updatedData.academicTitle).toBe("Updated Title")
    expect(updatedData.role).toBe(originalRole)

    // Verify the database was actually updated
    const userAfter = await db.select().from(Users).where(eq(Users.id, userBefore[0].id)).limit(1)
    expect(userAfter[0].nome).toBe("Updated Name")
    expect(userAfter[0].school).toBe("Updated School")
    expect(userAfter[0].academicTitle).toBe("Updated Title")
    expect(userAfter[0].role).toBe(originalRole)
  })
})