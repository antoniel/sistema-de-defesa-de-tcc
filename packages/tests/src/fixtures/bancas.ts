export interface TestBancaData {
  tituloTrabalho: string
  autor: string
  matricula: string
  turma: string
  periodoAcademico: string
  palavrasChave: string
  resumo: string
  abstract: string
  dataRealizacao: Date
  local: string
  modalidade: "remoto" | "local"
  cursoId: number
  orientadorId: number
  visible: boolean
  alunoId: number
}

export const getTestBancaData = (
  cursoId: number,
  orientadorId: number,
  alunoId: number,
  overrides: Partial<TestBancaData> = {}
): Omit<TestBancaData, "id"> => ({
  tituloTrabalho: "Banca de Teste",
  autor: "Aluno Teste",
  matricula: "222",
  turma: "T01",
  periodoAcademico: "2024.1",
  palavrasChave: "teste, hono, vitest",
  resumo: "Um resumo da banca de teste.",
  abstract: "An abstract of the test defense.",
  dataRealizacao: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
  local: "Online",
  modalidade: "remoto" as const,
  cursoId,
  orientadorId,
  visible: true,
  alunoId,
  ...overrides,
})

export const createTestBancaInput = (
  cursoId: number,
  orientadorId: number,
  alunoId: number,
  overrides: Partial<any> = {}
) => ({
  tituloTrabalho: "Nova Banca de TCC",
  palavrasChave: "tcc, novo",
  cursoId,
  resumo: "Resumo da nova banca",
  alunoId,
  dataRealizacao: new Date(),
  local: "Teams",
  orientadorId,
  autor: "Novo Aluno",
  matricula: "333",
  turma: "T02",
  periodoAcademico: "2024.2",
  abstract: "New abstract",
  modalidade: "remoto" as const,
  ...overrides,
})