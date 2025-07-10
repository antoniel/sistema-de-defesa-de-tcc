import { test, expect } from "@playwright/test"

test.describe("Account Creation Flow", () => {
  test("should create a new account successfully", async ({ page }) => {
    // 1. Acessar a página inicial
    await page.goto("/")
    
    // 2. Aguardar a página carregar e verificar se estamos na página inicial
    await expect(page).toHaveTitle(/Sistema de Defesas de TCC/)
    
    // 3. Clicar no botão "Regitre-se" (há um erro de digitação no código original)
    const registerButton = page.getByRole("button", { name: "Regitre-se" })
    await expect(registerButton).toBeVisible()
    await registerButton.click()
    
    // 4. Aguardar o modal de registro aparecer
    const registerDialog = page.getByRole("dialog")
    await expect(registerDialog).toBeVisible()
    
    // 5. Verificar se o título do modal está correto
    await expect(page.getByText("Criar Conta")).toBeVisible()
    
    // 6. Preencher o formulário de registro
    const testEmail = `test.user.${Date.now()}@example.com`
    
    // Nome completo
    await page.getByLabel("Nome Completo").fill("João Silva")
    
    // Email
    await page.getByLabel("Email").fill(testEmail)
    
    // Universidade
    await page.getByLabel("Universidade").fill("Universidade Federal da Bahia")
    
    // Matrícula
    await page.getByLabel("Matrícula").fill("123456789")
    
    // Título Acadêmico
    await page.getByLabel("Título Acadêmico").fill("Doutor")
    
    // Senha
    await page.getByLabel("Senha").fill("senha123")
    
    // 7. Submeter o formulário
    await page.getByRole("button", { name: "Registrar" }).click()
    
    // 8. Aguardar o processo de registro
    await expect(page.getByText("Registrando...")).toBeVisible()
    
    // 9. Verificar se a mensagem de sucesso aparece
    await expect(page.getByText("Conta criada com sucesso! ✅")).toBeVisible()
    await expect(page.getByText("Você já pode fazer o login.")).toBeVisible()
    
    // 10. Verificar se o modal foi fechado automaticamente
    await expect(registerDialog).not.toBeVisible()
    
    // 11. Verificar se o usuário pode fazer login com a conta criada
    const loginButton = page.getByRole("button", { name: "Login" })
    await loginButton.click()
    
    // Aguardar o modal de login aparecer
    const loginDialog = page.getByRole("dialog")
    await expect(loginDialog).toBeVisible()
    
    // Preencher credenciais de login
    await page.getByLabel("Email").fill(testEmail)
    await page.getByLabel("Senha").fill("senha123")
    
    // Fazer login
    await page.getByRole("button", { name: "Entrar" }).click()
    
    // Aguardar o processo de login
    await expect(page.getByText("Entrando...")).toBeVisible()
    
    // Verificar se o login foi bem-sucedido
    await expect(page.getByText("Login realizado com sucesso ✅")).toBeVisible()
    
    // Verificar se o usuário está logado (deve aparecer o nome no header)
    await expect(page.getByText("Olá, João Silva")).toBeVisible()
  })

  test("should show validation errors for invalid form data", async ({ page }) => {
    // 1. Acessar a página inicial
    await page.goto("/")
    
    // 2. Abrir o modal de registro
    await page.getByRole("button", { name: "Regitre-se" }).click()
    
    // 3. Tentar submeter o formulário vazio
    await page.getByRole("button", { name: "Registrar" }).click()
    
    // 4. Verificar se as mensagens de erro aparecem
    await expect(page.getByText("Nome é obrigatório")).toBeVisible()
    await expect(page.getByText("Email é obrigatório")).toBeVisible()
    await expect(page.getByText("Universidade é obrigatória")).toBeVisible()
    await expect(page.getByText("Matrícula é obrigatória")).toBeVisible()
    await expect(page.getByText("Título acadêmico é obrigatório")).toBeVisible()
    await expect(page.getByText("Senha é obrigatória")).toBeVisible()
  })

  test("should show error for invalid email format", async ({ page }) => {
    // 1. Acessar a página inicial
    await page.goto("/")
    
    // 2. Abrir o modal de registro
    await page.getByRole("button", { name: "Regitre-se" }).click()
    
    // 3. Preencher email inválido
    await page.getByLabel("Nome Completo").fill("João Silva")
    await page.getByLabel("Email").fill("email-invalido")
    await page.getByLabel("Universidade").fill("Universidade Federal da Bahia")
    await page.getByLabel("Matrícula").fill("123456789")
    await page.getByLabel("Título Acadêmico").fill("Doutor")
    await page.getByLabel("Senha").fill("senha123")
    
    // 4. Submeter o formulário
    await page.getByRole("button", { name: "Registrar" }).click()
    
    // 5. Verificar se a mensagem de erro de email aparece
    await expect(page.getByText("Email inválido")).toBeVisible()
  })

  test("should show error for password too short", async ({ page }) => {
    // 1. Acessar a página inicial
    await page.goto("/")
    
    // 2. Abrir o modal de registro
    await page.getByRole("button", { name: "Regitre-se" }).click()
    
    // 3. Preencher senha muito curta
    await page.getByLabel("Nome Completo").fill("João Silva")
    await page.getByLabel("Email").fill("joao@example.com")
    await page.getByLabel("Universidade").fill("Universidade Federal da Bahia")
    await page.getByLabel("Matrícula").fill("123456789")
    await page.getByLabel("Título Acadêmico").fill("Doutor")
    await page.getByLabel("Senha").fill("123")
    
    // 4. Submeter o formulário
    await page.getByRole("button", { name: "Registrar" }).click()
    
    // 5. Verificar se a mensagem de erro de senha aparece
    await expect(page.getByText("A senha deve ter pelo menos 6 caracteres")).toBeVisible()
  })
})