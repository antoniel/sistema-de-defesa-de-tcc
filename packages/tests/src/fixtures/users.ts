import * as bcrypt from "bcryptjs"

export interface TestUserData {
  email: string
  password: string
  nome: string
  role: "TEACHER" | "STUDENT" | "ADMIN"
  matricula: string
  status: "ACTIVE" | "INACTIVE"
  school: string
  academicTitle: string
  createdAt: Date
  updatedAt: Date
}

export const TEST_TEACHER: TestUserData = {
  email: "teacher@test.com",
  password: "Password123!",
  nome: "Test Teacher",
  role: "TEACHER",
  matricula: "111",
  status: "ACTIVE",
  school: "ICC",
  academicTitle: "PhD",
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const TEST_STUDENT: TestUserData = {
  email: "student@test.com",
  password: "Password123!",
  nome: "Test Student",
  role: "STUDENT",
  matricula: "222",
  status: "ACTIVE",
  school: "ICC",
  academicTitle: "BSc",
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const TEST_ADMIN: TestUserData = {
  email: "admin@test.com",
  password: "Password123!",
  nome: "Test Admin",
  role: "ADMIN",
  matricula: "333",
  status: "ACTIVE",
  school: "ICC",
  academicTitle: "PhD",
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const TEST_USER_BASIC: TestUserData = {
  email: "test@example.com",
  password: "Password123!",
  nome: "Test User",
  role: "TEACHER",
  matricula: "123",
  status: "ACTIVE",
  school: "Test School",
  academicTitle: "PhD",
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const createTestUserWithPasswordHash = async (userData: TestUserData) => {
  const passwordHash = await bcrypt.hash(userData.password, 10)
  return {
    ...userData,
    passwordHash,
  }
}

export const createMultipleTestUsers = async (users: TestUserData[]) => {
  const usersWithHashes = await Promise.all(
    users.map(async (user) => createTestUserWithPasswordHash(user))
  )
  return usersWithHashes
}