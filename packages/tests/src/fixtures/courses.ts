export interface TestCourseData {
  nome: string
  sigla: string
}

export const TEST_CURSO: TestCourseData = {
  nome: "Ciência da Computação",
  sigla: "BCC",
}

export const TEST_CURSO_SI: TestCourseData = {
  nome: "Sistemas de Informação",
  sigla: "BSI",
}

export const createTestCourse = (courseData: Partial<TestCourseData> = {}): TestCourseData => {
  return {
    ...TEST_CURSO,
    ...courseData,
  }
}