/**
 * Fluxos E2E com e2e runner (tester.army).
 * Rodam contra o app web (5173) apontando para o server de teste (9100, PGlite
 * com seed determinístico do @tcc/tests: admin@e2e.local / senha-e2e-123).
 *
 * Cada goal agenticamente verificado de agent.act fica gravado em
 * .e2e/cache/ (COMMITADO no git) e é replayado sem chamar o modelo nas runs
 * seguintes — só regenera quando a UI muda de verdade.
 */
import { test } from '@e2e-dev/web'
import { expect, unique } from 'e2e'

const ADMIN_EMAIL = 'admin@e2e.local'
const ADMIN_PASSWORD = 'senha-e2e-123'

test('admin entra pelo cabeçalho, vê o menu do usuário e sai', async ({ app, agent, screen }) => {
  await app.open('/')

  await agent.act(
    'abra o diálogo de login no cabeçalho da página e entre com o email {email} e a senha {senha}, confirmando o envio do formulário',
    { params: { email: ADMIN_EMAIL, senha: ADMIN_PASSWORD } },
  )
  await agent.assert('o cabeçalho mostra o botão do menu do usuário de admin, com "Admin E2E" e "Administrador"')

  await agent.act('abra o menu do usuário no cabeçalho e clique na opção Sair')
  await agent.assert('o cabeçalho voltou ao estado deslogado, oferecendo o botão de entrar')
})

test('visitante anônimo vê a lista pública e abre o detalhe da banca', async ({ app, agent, screen, browser }) => {
  await app.open('/')

  await expect(screen.getByText('Banca Futura Pública E2E')).toBeVisible()

  await agent.act('abra o detalhe da banca cujo título é "Banca Futura Pública E2E"')
  await expect(browser).toHaveURL(/banca/)
  await agent.assert(
    'esta é a página de detalhe da banca: nomeia o trabalho, o autor "Aluno Ocupado E2E" e o orientador "Orientador E2E"',
  )
})

test('admin cria convite de professor pelo formulário e ele vira pendente na lista', async ({ app, agent }) => {
  const stamp = Date.now()
  const inviteName = unique(`Professor Convidado E2E ${stamp}`)
  const inviteEmail = unique(`prof.convidado.e2e.${stamp}@test.local`)

  await app.open('/')
  await agent.act(
    'abra o diálogo de login no cabeçalho e entre com o email {email} e a senha {senha}',
    { params: { email: ADMIN_EMAIL, senha: ADMIN_PASSWORD } },
  )
  await agent.assert('o cabeçalho mostra o menu do usuário de "Admin E2E"')

  await app.open('/admin/teacher-invitations')

  await agent.act(
    'use o formulário para criar um convite de professor com o nome {nome} e o email {email}, e envie',
    { params: { nome: inviteName, email: inviteEmail } },
  )
  await agent.assert(
    `a lista de convites de professores mostra o convite criado para o email "${inviteEmail.value}" com status pendente`,
  )
})

const STUDENT_EMAIL = 'student.free@e2e.local'
const PRIVATE_BANCA_ID = 3 // seed: banca privada do student.private@e2e.local (visible: false)

test('banca privada não é acessível por URL direta para visitante anônimo', async ({ app, agent }) => {
  await app.open(`/banca/${PRIVATE_BANCA_ID}`)

  await agent.assert(
    'a página está em estado de erro ("Banca não encontrada"), e em nenhuma parte da tela aparecem o título "Banca Futura Privada E2E", o autor "Aluno Privado E2E" ou os dados dessa banca privada',
    { vision: true },
  )
})

test('aluno não vê os atalhos de administração no menu do usuário', async ({ app, agent }) => {
  await app.open('/')
  await agent.act(
    'abra o diálogo de login no cabeçalho e entre com o email {email} e a senha {senha}',
    { params: { email: STUDENT_EMAIL, senha: ADMIN_PASSWORD } },
  )
  await agent.assert('o cabeçalho mostra o menu do usuário de "Aluno Livre E2E"')

  await agent.act('abra o menu do usuário no cabeçalho')
  await agent.assert(
    'o menu aberto NÃO contém os links de administração "Cursos" e "Usuários"; contém apenas itens de usuário comum (perfil, e-mail, deslogar)',
  )
})
