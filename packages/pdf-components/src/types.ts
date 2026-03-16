export interface DocumentInfo {
  autor: string
  tituloTrabalho: string
  dataRealizacao: string | Date
  periodoAcademico: string
  turma?: string
  curso: {
    nome: string
  }
  membros: Array<{
    id: number
    role: "orientador" | "coorientador" | "aluno" | "avaliador"
    bancaId: number
    usuarioId: number
    nota: string | null
    usuario: {
      nome: string
      email: string
      id: number
      role: "STUDENT" | "TEACHER" | "ADMIN"
      createdAt: string
      updatedAt: string
      [key: string]: any
    }
  }>
  [key: string]: any
}