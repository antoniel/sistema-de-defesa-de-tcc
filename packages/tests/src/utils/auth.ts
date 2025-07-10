import type { TestUserData } from "../fixtures/users.js"

export const createLoginHelper = (client: any) => {
  return async (user: { email: string; password: string }) => {
    const res = await client.auth.login.$post({ json: user })
    const data = (await res.json()) as { token: string }
    return data.token
  }
}

export const createMultipleLoginTokens = async (
  client: any,
  users: TestUserData[]
) => {
  const loginUser = createLoginHelper(client)
  const tokens = await Promise.all(
    users.map(async (user) => ({
      user,
      token: await loginUser({ email: user.email, password: user.password }),
    }))
  )
  return tokens
}