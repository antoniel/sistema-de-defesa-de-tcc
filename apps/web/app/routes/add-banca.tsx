import { KeywordsList } from "@/components/banca/KeywordsList"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useIsTeacher from "@/hooks/use-role"
import { useToast } from "@/hooks/use-toast"
import { type RpcType } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import type { InsertBanca } from "@tcc/server"
import React, { useState } from "react"
import { Controller, useForm, useFormContext } from "react-hook-form"
import { href, Navigate, useNavigate } from "react-router"
import { match } from "ts-pattern"
import type { Route } from "./+types/add-banca"

export const meta: Route.MetaFunction = () => [{ title: "SISDEF - Cadastrar Defesa" }]

type query = RpcType<typeof apiClient.banca.$post>

type BancaFormData = Omit<InsertBanca, "ano" | "semestreLetivo"> & {
  visible: boolean
  hora: string
  orientadorId?: number
  alunoId: number
  periodoAcademico: string // New combined field for ano.semestreLetivo
  avaliador1Id?: number
  avaliador2Id?: number
  avaliador3Id?: number
}

const DEV_SEED_DATA: Partial<BancaFormData> = {
  tituloTrabalho: "Desenvolvimento de Ferramenta de Teste Automatizado para Formulários",
  resumo:
    "Este trabalho descreve o desenvolvimento de uma ferramenta para preenchimento automático de formulários web complexos em ambiente de desenvolvimento, visando agilizar testes e demonstrações.",
  abstract:
    "This work describes the development of a tool for automatically filling complex web forms in a development environment, aiming to speed up testing and demonstrations.",
  visible: true,
  autor: "Dev Silva",
  matricula: "123456789",
  palavrasChave: "teste, desenvolvimento, automação, formulário",
  turma: "2024.2",
  cursoId: 1,
  periodoAcademico: "2024.2", // Updated to combined format
  dataRealizacao: new Date("2024-01-01"),
  hora: "14:00",
  modalidade: "local",
  local: "Sala H-101",
  // avaliador3Id: 3, // Commented out to test partial banca scenario
}

import { useAddBancaMutation, useStudentsAvailableForBanca, useTeachers } from "@/hooks"

const FORM_STEPS = [
  { id: 0, name: "Informações Básicas" },
  { id: 1, name: "Informações do Autor" },
  { id: 2, name: "Metadados e Agendamento" },
  { id: 3, name: "Avaliadores" },
  { id: 4, name: "Revisão e Confirmação" },
]

type SubmissionPayload = query["input"]["json"] & {
  orientadorId?: number
  membros?: Array<{ id: number }>
}

export default function AddBancaPage() {
  const { data: user, isLoading } = useUser()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4 | (number & {})>(0)
  const { toast } = useToast()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const currentSemester = currentMonth > 6 ? "2" : "1"
  const defaultPeriodoAcademico = `${currentYear}.${currentSemester}`

  const form = useForm<BancaFormData>({
    defaultValues: {
      visible: false,
      modalidade: "local",
      periodoAcademico: defaultPeriodoAcademico,
      autor: user?.nome,
      matricula: user?.matricula,
      alunoId: user?.id,
      cursoId: undefined,
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    if (user) {
      form.setValue("autor", user.nome)
      form.setValue("matricula", user.matricula)
      // Se for aluno, fixar o alunoId
      if (user.role === "STUDENT") {
        form.setValue("alunoId", user.id)
      }
    }
  }, [user])

  const addBancaMutation = useAddBancaMutation()

  const onSubmit = (data: BancaFormData) => {
    let dataRealizacaoCompleta = data.dataRealizacao
    if (data.hora && data.dataRealizacao) {
      const dataStr = data.dataRealizacao.toISOString().split("T")[0]
      dataRealizacaoCompleta = new Date(`${dataStr}T${data.hora}:00`)
    }

    const { hora, avaliador1Id, avaliador2Id, avaliador3Id, ...dataWithoutExtraFields } = data

    const membros = [{ id: Number(avaliador1Id) }, { id: Number(avaliador2Id) }, { id: Number(avaliador3Id) }].filter(
      (membro) => !!membro.id
    )

    const submissionData: SubmissionPayload = {
      ...dataWithoutExtraFields,
      matricula: data.matricula || "",
      cursoId: Number(data.cursoId),
      periodoAcademico: data.periodoAcademico,
      visible: Boolean(data.visible),
      alunoId: Number(data.alunoId),
      orientadorId: Number(data.orientadorId),
      dataRealizacao: dataRealizacaoCompleta,
      membros,
    }
    addBancaMutation.mutate(
      { json: submissionData as query["input"]["json"] },
      {
        onSuccess: () => {
          toast({
            title: "Defesa cadastrada com sucesso ✅",
            description: "A defesa foi cadastrada com sucesso",
          })
          navigate("/")
        },
        onError: (error: any) => {
          console.error("Erro ao cadastrar defesa:", error)

          // Tentar extrair mensagem de erro de diferentes estruturas
          let errorMessage = "Ocorreu um erro ao cadastrar a defesa"

          if (error?.message) {
            errorMessage = error.message
          } else if (error?.error?.issues && Array.isArray(error.error.issues)) {
            // Erro de validação Zod
            const issues = error.error.issues.map((issue: any) => {
              const path = issue.path.join(".")
              return `${path}: ${issue.message}`
            }).join(", ")
            errorMessage = issues
          } else if (typeof error === "string") {
            errorMessage = error
          }

          toast({
            title: "Erro ao cadastrar defesa ❌",
            description: errorMessage,
            variant: "destructive",
          })
        },
      }
    )
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsToValidate(currentStep)
    const result = await form.trigger(fieldsToValidate as any)

    if (result) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1))
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    window.scrollTo(0, 0)
  }

  const getFieldsToValidate = (step: number): (keyof BancaFormData)[] => {
    switch (step) {
      case 0:
        return ["tituloTrabalho", "resumo", "abstract"]
      case 1:
        return ["autor", "matricula", "orientadorId", "alunoId"]
      case 2:
        return [
          "palavrasChave",
          "turma",
          "cursoId",
          "periodoAcademico", // Updated to use combined field
          "dataRealizacao",
          "hora",
          "modalidade",
          "local",
        ]
      case 3:
        return ["avaliador1Id", "avaliador2Id"] // Only require first 2 evaluators
      default:
        return []
    }
  }

  if (isLoading) {
    return <AddBancaSkeleton />
  }

  if (!user) {
    return <Navigate to={href("/")} />
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <div className="mb-8 flex justify-center">
        <StepIndicator currentStep={currentStep} steps={FORM_STEPS} setCurrentStep={setCurrentStep} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
          <div className="space-y-4">
            {
              // renderFormStep()
              match(currentStep)
                .with(0, () => <BasicInfoSection />)
                .with(1, () => <AuthorInfoSection />)
                .with(2, () => <WorkAndDefenseSection />)
                .with(3, () => <EvaluatorsSection />)
                .with(4, () => <ReviewSection />)
                .otherwise(() => null)
            }
          </div>
          <div className="flex justify-between items-center pt-4">
            {process.env.NODE_ENV === "development" && <DevFillButton />}
            <div className="flex gap-4">
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
              )}

              {currentStep < FORM_STEPS.length - 1 && (
                <Button type="button" onClick={nextStep}>
                  Próximo
                </Button>
              )}

              {currentStep === FORM_STEPS.length - 1 && (
                <>
                  <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Defesa</Button>
                </>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

function AddBancaSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
    </div>
  )
}

const StepIndicator = ({
  currentStep,
  steps,
  setCurrentStep,
}: {
  currentStep: number
  steps: typeof FORM_STEPS
  setCurrentStep: (step: number) => void
}) => {
  return (
    <div className="flex items-center ">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            type="button"
            onClick={() => setCurrentStep(index)}
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors hover:bg-primary/80 ${
              index <= currentStep
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-muted hover:border-primary/50"
            }`}
          >
            {index + 1}
          </button>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-full flex-1 ${index < currentStep ? "bg-primary" : "bg-muted"}`}
              style={{ width: "100px" }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

const BasicInfoSection = () => {
  const isUserTeacher = useIsTeacher()
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BancaFormData>()
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
      <div className="flex items-center gap-4">
        <div className="flex-grow">
          <Label htmlFor="tituloTrabalho">Título do Trabalho</Label>
          <Input
            id="tituloTrabalho"
            {...register("tituloTrabalho", { required: "Título é obrigatório" })}
            placeholder="Título completo do trabalho"
            aria-invalid={errors.tituloTrabalho ? "true" : "false"}
          />
          {errors.tituloTrabalho && <p className="text-sm text-red-600 mt-1">{errors.tituloTrabalho.message}</p>}
        </div>
        {isUserTeacher && (
          <Controller
            name="visible"
            control={control}
            defaultValue={false}
            render={({ field }) => (
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="visible" checked={field.value} onCheckedChange={field.onChange} ref={field.ref} />
                <Label
                  htmlFor="visible"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap"
                >
                  {field.value ? "Pública" : "Privada"}
                </Label>
              </div>
            )}
          />
        )}
      </div>

      <div>
        <Label htmlFor="resumo">Resumo</Label>
        <Textarea
          id="resumo"
          {...register("resumo", { required: "Resumo é obrigatório" })}
          placeholder="Resumo em português"
          rows={8}
          aria-invalid={errors.resumo ? "true" : "false"}
        />
        {errors.resumo && <p className="text-sm text-red-600 mt-1">{errors.resumo.message}</p>}
      </div>

      <div>
        <Label htmlFor="abstract">Abstract</Label>
        <Textarea
          id="abstract"
          {...register("abstract", { required: "Abstract é obrigatório" })}
          placeholder="Abstract in English"
          rows={8}
          aria-invalid={errors.abstract ? "true" : "false"}
        />
        {errors.abstract && <p className="text-sm text-red-600 mt-1">{errors.abstract.message}</p>}
      </div>
    </>
  )
}

const AuthorInfoSection = () => {
  const isUserTeacher = useIsTeacher()
  const { data: user } = useUser()
  const isUserStudent = user?.role === "STUDENT"
  const [searchTerm, setSearchTerm] = useState("")
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<BancaFormData>()

  // Buscar a lista de professores do servidor
  const { data: teachers, isLoading: isLoadingTeachers, error: teachersError } = useTeachers()
  const studentsQuery = useStudentsAvailableForBanca()

  const filteredStudents = React.useMemo(() => {
    if (!studentsQuery.data) return []
    if (!searchTerm) return studentsQuery.data

    const term = searchTerm.toLowerCase()
    return studentsQuery.data.filter(
      (student) =>
        student.nome.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.matricula?.toLowerCase().includes(term)
    )
  }, [studentsQuery.data, searchTerm])

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Informações do Autor</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="autor">Aluno</Label>
          {isUserStudent ? (
            <>
              <Input
                id="autor"
                {...register("autor")}
                value={user?.nome || ""}
                disabled
                className="bg-muted"
              />
              <Controller
                name="alunoId"
                control={control}
                rules={{ required: "ID do aluno é obrigatório" }}
                render={({ field }) => {
                  // Garantir que o alunoId seja definido quando o usuário for aluno
                  React.useEffect(() => {
                    if (user?.id && !field.value) {
                      field.onChange(user.id)
                    }
                  }, [user?.id, field.value])

                  return <input type="hidden" {...field} value={field.value || user?.id || ""} />
                }}
              />
            </>
          ) : (
            <Controller
              name="autor"
              control={control}
              rules={{ required: "Aluno é obrigatório" }}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    const student = studentsQuery.data?.find((student) => student.id.toString() === value)
                    if (student) {
                      field.onChange(student.nome)
                      setValue("matricula", student.matricula)
                      setValue("alunoId", Number(value))
                      setSearchTerm("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b sticky top-0 bg-background z-10">
                      <Input
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="bg-background"
                      />
                    </div>
                    {studentsQuery.isLoading ? (
                      <SelectItem value="0" disabled>
                        Carregando alunos...
                      </SelectItem>
                    ) : studentsQuery.error ? (
                      <SelectItem value="0" disabled>
                        Erro ao carregar alunos
                      </SelectItem>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.nome} - ({student.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>
                        {searchTerm ? "Nenhum aluno encontrado para a busca" : "Nenhum aluno encontrado"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {errors.autor && <p className="text-sm text-red-600 mt-1">{errors.autor.message}</p>}
          {errors.alunoId && <p className="text-sm text-red-600 mt-1">{errors.alunoId.message}</p>}
        </div>
        <div>
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            {...register("matricula", { required: isUserTeacher ? "Matrícula é obrigatória" : false })}
            placeholder="Matrícula"
            aria-invalid={errors.matricula ? "true" : "false"}
            disabled={true}
          />
          {errors.matricula && <p className="text-sm text-red-600 mt-1">{errors.matricula.message}</p>}
        </div>
        <div>
          <Label htmlFor="orientadorId">Orientador</Label>
          <Controller
            name="orientadorId"
            control={control}
            rules={{ required: "Orientador é obrigatório" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o orientador..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTeachers ? (
                    <SelectItem value="0" disabled>
                      Carregando professores...
                    </SelectItem>
                  ) : teachersError ? (
                    <SelectItem value="0" disabled>
                      Erro ao carregar professores
                    </SelectItem>
                  ) : teachers && teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>
                      Nenhum professor encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.orientadorId && <p className="text-sm text-red-600 mt-1">{errors.orientadorId.message}</p>}
        </div>
      </div>
    </>
  )
}

const WorkAndDefenseSection = () => {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BancaFormData>()
  const modalidadeValue = watch("modalidade")

  const handleYearSemesterFormat = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "periodoAcademico" | "turma"
  ) => {
    setValue(fieldName, e.target.value)
  }

  const yearSemesterValidationRules = {
    required: "Este campo é obrigatório",
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Metadados e Agendamento</h2>

      {/* Seção de Metadados */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-medium mb-3">Metadados do Trabalho</h3>
        <div>
          <Label htmlFor="palavrasChave">Palavras Chave</Label>
          <Input
            id="palavrasChave"
            {...register("palavrasChave", { required: "Palavras-chave são obrigatórias" })}
            placeholder="Separadas por vírgula"
            aria-invalid={errors.palavrasChave ? "true" : "false"}
          />
          {errors.palavrasChave && <p className="text-sm text-red-600 mt-1">{errors.palavrasChave.message}</p>}
          <p className="text-sm text-muted-foreground">Separe as palavras-chave por vírgula (,).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label htmlFor="turma">Turma</Label>
            <Controller
              name="turma"
              control={control}
              rules={yearSemesterValidationRules}
              render={({ field }) => (
                <Input
                  id="turma"
                  placeholder="Ex: 010101"
                  defaultValue={"010101"}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e)
                    handleYearSemesterFormat(e, "turma")
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={errors.turma ? "true" : "false"}
                />
              )}
            />
            {errors.turma && <p className="text-sm text-red-600 mt-1">{errors.turma.message}</p>}
          </div>
          <div>
            <Label htmlFor="curso">Curso</Label>
            <Controller
              name="cursoId"
              control={control}
              rules={{ required: "Curso é obrigatório" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value?.toString() ?? ""}>
                  <SelectTrigger id="curso" ref={field.ref} aria-invalid={errors.cursoId ? "true" : "false"}>
                    <SelectValue placeholder="Selecione o curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ciência da Computação</SelectItem>
                    <SelectItem value="2">Sistemas de Informação</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cursoId && <p className="text-sm text-red-600 mt-1">{errors.cursoId.message}</p>}
          </div>
          <div>
            <Label htmlFor="periodoAcademico">Período Acadêmico</Label>
            <Controller
              name="periodoAcademico"
              control={control}
              rules={yearSemesterValidationRules}
              render={({ field }) => (
                <Input
                  id="periodoAcademico"
                  placeholder="Ex: 2024.2"
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e)
                    handleYearSemesterFormat(e, "periodoAcademico")
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={errors.periodoAcademico ? "true" : "false"}
                />
              )}
            />
            {errors.periodoAcademico && <p className="text-sm text-red-600 mt-1">{errors.periodoAcademico.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Formato: Ano.Semestre (ex: 2024.2)</p>
          </div>
        </div>
      </div>

      {/* Seção de Agendamento */}
      <div>
        <h3 className="text-lg font-medium mb-3">Agendamento da Defesa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="data_realizacao">Data da Defesa</Label>
            <Controller
              name="dataRealizacao"
              control={control}
              rules={{
                required: "Data é obrigatória",
                validate: (value) => {
                  if (!value) {
                    return "Data é obrigatória"
                  }
                  return true
                },
              }}
              render={({ field }) => (
                <Input
                  id="dataRealizacao"
                  type="date"
                  value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!value) {
                      field.onChange(undefined)
                    } else {
                      // Adiciona o T00:00:00 para evitar problemas de fuso horário
                      field.onChange(new Date(`${value}T00:00:00`))
                    }
                  }}
                  onBlur={field.onBlur}
                  aria-invalid={errors.dataRealizacao ? "true" : "false"}
                />
              )}
            />
            {errors.dataRealizacao && <p className="text-sm text-red-600 mt-1">{errors.dataRealizacao.message}</p>}
          </div>
          <div>
            <Label htmlFor="hora">Hora da Defesa</Label>
            <Input
              id="hora"
              type="time"
              {...register("hora", { required: "Hora é obrigatória" })}
              aria-invalid={errors.hora ? "true" : "false"}
            />
            {errors.hora && <p className="text-sm text-red-600 mt-1">{errors.hora.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-4">
          <div className="md:col-span-1">
            <Label>Tipo de Banca</Label>
            <Controller
              name="modalidade"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4 pt-2"
                  ref={field.ref}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="local" id="local" />
                    <Label htmlFor="local">Presencial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remoto" id="remoto" />
                    <Label htmlFor="remoto">Remoto</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="local">{modalidadeValue === "remoto" ? "Link da Reunião" : "Local Físico"}</Label>
            <Input
              id="local"
              {...register("local", { required: "Local/Link é obrigatório" })}
              aria-invalid={errors.local ? "true" : "false"}
              placeholder={modalidadeValue === "remoto" ? "https://meet.google.com/..." : "Sala, Auditório, etc."}
            />
            {errors.local && <p className="text-sm text-red-600 mt-1">{errors.local.message}</p>}
          </div>
        </div>
      </div>
    </>
  )
}

const EvaluatorsSection = () => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<BancaFormData>()

  // Watch the orientadorId to include as avaliador1
  const orientadorId = watch("orientadorId")

  // Buscar a lista de professores
  const { data: teachers, isLoading: isLoadingTeachers, error: teachersError } = useTeachers()

  // Filter teachers excluding the supervisor
  const availableTeachers = teachers?.filter((teacher) => teacher.id !== Number(orientadorId)) || []

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Avaliadores da Banca</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Selecione os avaliadores para compor a banca. Mínimo: orientador + 1 avaliador adicional. Para gerar
        certificados e relatórios, é necessário ter 3 avaliadores com notas atribuídas.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="avaliador1">1º Avaliador (Orientador)</Label>
          <Controller
            name="avaliador1Id"
            control={control}
            rules={{ required: "O orientador deve ser selecionado como avaliador" }}
            render={({ field }) => {
              // Automatically set orientador as avaliador1
              if (orientadorId && !field.value) {
                field.onChange(orientadorId)
              }

              const orientador = teachers?.find((t) => t.id === Number(orientadorId))

              return (
                <div className="flex items-center p-3 border rounded bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{orientador?.nome || "Orientador não selecionado"}</p>
                    <p className="text-sm text-muted-foreground">{orientador?.academicTitle}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">Orientador</span>
                </div>
              )
            }}
          />
          {errors.avaliador1Id && <p className="text-sm text-red-600 mt-1">{errors.avaliador1Id.message}</p>}
        </div>

        <div>
          <Label htmlFor="avaliador2">2º Avaliador</Label>
          <Controller
            name="avaliador2Id"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString() ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o 2º avaliador..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTeachers ? (
                    <SelectItem value="0" disabled>
                      Carregando professores...
                    </SelectItem>
                  ) : teachersError ? (
                    <SelectItem value="0" disabled>
                      Erro ao carregar professores
                    </SelectItem>
                  ) : availableTeachers.length > 0 ? (
                    availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.nome} - {teacher.academicTitle}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>
                      Nenhum professor disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.avaliador2Id && <p className="text-sm text-red-600 mt-1">{errors.avaliador2Id.message}</p>}
        </div>

        <div>
          <Label htmlFor="avaliador3">3º Avaliador</Label>
          <Controller
            name="avaliador3Id"
            control={control}
            rules={{ required: false }} // Made optional
            render={({ field }) => {
              const avaliador2Id = watch("avaliador2Id")
              const filteredTeachers = availableTeachers.filter((teacher) => teacher.id !== Number(avaliador2Id))

              return (
                <Select onValueChange={field.onChange} value={field.value?.toString() ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o 3º avaliador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTeachers ? (
                      <SelectItem value="0" disabled>
                        Carregando professores...
                      </SelectItem>
                    ) : teachersError ? (
                      <SelectItem value="0" disabled>
                        Erro ao carregar professores
                      </SelectItem>
                    ) : filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.nome} - {teacher.academicTitle}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>
                        Nenhum professor disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )
            }}
          />
          {errors.avaliador3Id && <p className="text-sm text-red-600 mt-1">{errors.avaliador3Id.message}</p>}
        </div>
      </div>
    </>
  )
}

// Helper components for review section
const ReviewField = ({
  label,
  value,
  className = "",
}: {
  label: string
  value: string | null | undefined
  className?: string
}) => (
  <div className={className}>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value || "Não informado"}</p>
  </div>
)

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-lg font-medium border-b pb-2 mb-2">{title}</h3>
)

const EvaluatorCard = ({ teacher }: { teacher: any }) => (
  <div className="flex items-center justify-between p-3 border rounded">
    <div>
      <p className="font-medium">{teacher?.nome || "Não selecionado"}</p>
      <p className="text-sm text-muted-foreground">{teacher?.academicTitle}</p>
    </div>
  </div>
)

const BasicInfoReviewSection = ({ values }: { values: BancaFormData }) => (
  <div>
    <SectionHeader title="Informações Básicas" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ReviewField label="Título do Trabalho" value={values.tituloTrabalho} />
      <ReviewField label="Visibilidade" value={values.visible ? "Pública" : "Privada"} />
    </div>
    <ReviewField label="Resumo" value={values.resumo} className="mt-2" />
    <ReviewField label="Abstract" value={values.abstract} className="mt-2" />
  </div>
)

const AuthorInfoReviewSection = ({ values, orientador }: { values: BancaFormData; orientador: any }) => (
  <div className="space-y-4">
    <SectionHeader title="Informações do Autor" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ReviewField label="Autor" value={values.autor} />
      <ReviewField label="Matrícula" value={values.matricula} />
    </div>
    <div>
      <ReviewField label="Orientador" value={orientador ? `${orientador.nome}` : "Não selecionado"} />
      <p className="text-sm text-muted-foreground">{`(${orientador?.academicTitle || ""})`}</p>
    </div>
  </div>
)

const EvaluatorsReviewSection = ({ values, teachers }: { values: BancaFormData; teachers: any[] }) => {
  const orientador = teachers?.find((teacher) => Number(teacher.id) === Number(values.orientadorId))
  const avaliador2 = teachers?.find((teacher) => Number(teacher.id) === Number(values.avaliador2Id))
  const avaliador3 = teachers?.find((teacher) => Number(teacher.id) === Number(values.avaliador3Id))

  return (
    <div>
      <SectionHeader title="Avaliadores da Banca" />
      <div className="space-y-3">
        <EvaluatorCard teacher={orientador} />
        <EvaluatorCard teacher={avaliador2} />
        <EvaluatorCard teacher={avaliador3} />
      </div>
    </div>
  )
}

const MetadataReviewSection = ({ values }: { values: BancaFormData }) => {
  const cursoNomes = {
    "1": "Ciência da Computação",
    "2": "Sistemas de Informação",
  }

  return (
    <div>
      <SectionHeader title="Metadados do Trabalho" />
      <KeywordsList keywords={values.palavrasChave} className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <ReviewField label="Turma" value={values.turma} />
        <ReviewField label="Curso" value={cursoNomes[String(values.cursoId) as keyof typeof cursoNomes]} />
        <ReviewField label="Período Acadêmico" value={values.periodoAcademico} />
      </div>
    </div>
  )
}

const DefenseScheduleReviewSection = ({ values }: { values: BancaFormData }) => (
  <div>
    <SectionHeader title="Agendamento da Defesa" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ReviewField
        label="Data"
        value={
          values.dataRealizacao
            ? new Date(values.dataRealizacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })
            : "Não definida"
        }
      />
      <ReviewField label="Hora" value={values.hora} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <ReviewField label="Modalidade" value={values.modalidade === "local" ? "Presencial" : "Remoto"} />
      <ReviewField label={values.modalidade === "local" ? "Local" : "Link"} value={values.local} />
    </div>
  </div>
)

const ReviewSection = () => {
  const { getValues } = useFormContext<BancaFormData>()
  const values = getValues()
  const { data: teachers } = useTeachers()

  const orientador = teachers?.find((teacher) => Number(teacher.id) === Number(values.orientadorId))

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Revisão e Confirmação</h2>
      <div className="space-y-6 border rounded-lg p-4">
        <BasicInfoReviewSection values={values} />
        <AuthorInfoReviewSection values={values} orientador={orientador} />
        <EvaluatorsReviewSection values={values} teachers={teachers || []} />
        <MetadataReviewSection values={values} />
        <DefenseScheduleReviewSection values={values} />
      </div>
    </>
  )
}

const DevFillButton = () => {
  const { reset } = useFormContext<BancaFormData>()

  const handleFill = () => {
    const formDataForReset: Partial<BancaFormData> = {
      ...DEV_SEED_DATA,
      periodoAcademico: DEV_SEED_DATA.periodoAcademico,
      cursoId: DEV_SEED_DATA.cursoId || 1,
      visible: Boolean(DEV_SEED_DATA.visible),
      orientadorId: DEV_SEED_DATA.orientadorId,
    }
    reset(formDataForReset as unknown as BancaFormData)
  }

  return (
    <Button type="button" variant="secondary" onClick={handleFill}>
      Fill Form (Dev)
    </Button>
  )
}
