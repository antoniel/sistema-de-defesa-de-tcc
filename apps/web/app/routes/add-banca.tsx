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
import { rpcReturn, type RpcType } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useUser } from "@/services/useUser"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { InsertBanca, SelectUser } from "@tcc/server"
import React, { useState } from "react"
import { Controller, useForm, useFormContext } from "react-hook-form"
import { href, Navigate, useNavigate } from "react-router"
import { match } from "ts-pattern"

type query = RpcType<typeof apiClient.banca.$post>

type BancaFormData = Omit<InsertBanca, "ano" | "semestreLetivo"> & {
  visible: boolean
  hora: string
  orientadorId?: number
  alunoId: number
  periodoAcademico: string // New combined field for ano.semestreLetivo
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
  turma: "2024/2",
  cursoId: 1,
  periodoAcademico: "2024.2", // Updated to combined format
  dataRealizacao: new Date("2024-01-01"),
  hora: "14:00",
  modalidade: "local",
  local: "Sala H-101",
  orientadorId: 1,
}

import { useTeachers, useStudents, useAddBancaMutation } from "@/hooks"

const FORM_STEPS = [
  { id: 0, name: "Informações Básicas" },
  { id: 1, name: "Informações do Autor" },
  { id: 2, name: "Metadados e Agendamento" },
  { id: 3, name: "Revisão e Confirmação" },
]

type SubmissionPayload = query["input"]["json"] & {
  orientadorId?: number
}

export default function AddBancaPage() {
  const { data: user, isLoading } = useUser()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | (number & {})>(0)
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
      cursoId: undefined,
      alunoId: 0,
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    if (user) {
      form.setValue("autor", user.nome)
      form.setValue("matricula", user.matricula)
    }
  }, [user])

  const addBancaMutation = useAddBancaMutation()

  const onSubmit = (data: BancaFormData) => {
    // Extract year and semester from periodoAcademico (format: YYYY.S)
    const [ano, semestreLetivo] = data.periodoAcademico.split(".")

    // Combine date and time
    let dataRealizacaoCompleta = data.dataRealizacao
    if (data.hora && data.dataRealizacao) {
      const dataStr = data.dataRealizacao.toISOString().split('T')[0]
      dataRealizacaoCompleta = new Date(`${dataStr}T${data.hora}:00`)
    }

    const submissionData: SubmissionPayload = {
      ...data,
      matricula: data.matricula || "",
      cursoId: Number(data.cursoId),
      periodoAcademico: data.periodoAcademico,
      visible: Boolean(data.visible),
      alunoId: Number(data.alunoId),
      orientadorId: Number(data.orientadorId),
      dataRealizacao: dataRealizacaoCompleta,
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
          if (error?.message) {
            toast({
              title: "Erro ao cadastrar defesa ",
              description: error.message,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Erro ao cadastrar defesa ❌",
              description: "Ocorreu um erro ao cadastrar a defesa",
              variant: "destructive",
            })
          }
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
                .with(3, () => <ReviewSection />)
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
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentStep ? "bg-primary text-primary-foreground border-primary" : "bg-background border-muted"
            }`}
          >
            {index + 1}
          </div>
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
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<BancaFormData>()

  // Buscar a lista de professores do servidor
  const { data: teachers, isLoading: isLoadingTeachers, error: teachersError } = useTeachers()
  const studentsQuery = useStudents()

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Informações do Autor</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="autor">Aluno</Label>
          <Controller
            name="alunoId"
            control={control}
            rules={{ required: "Aluno é obrigatório", min: { value: 1, message: "Selecione um aluno" } }}
            render={({ field }) => (
              <Controller
                name="autor"
                control={control}
                rules={{ required: "Aluno é obrigatório" }}
                render={({ field: autorField }) => (
                  <Select
                    onValueChange={(value) => {
                      const student = studentsQuery.data?.find((student) => student.id.toString() === value)
                      if (student) {
                        autorField.onChange(student.nome)
                        setValue("matricula", student.matricula)
                        field.onChange(Number(value))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsQuery.isLoading ? (
                        <SelectItem value="0" disabled>
                          Carregando alunos...
                        </SelectItem>
                      ) : studentsQuery.error ? (
                        <SelectItem value="0" disabled>
                          Erro ao carregar alunos
                        </SelectItem>
                      ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
                        studentsQuery.data.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.nome}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>
                          Nenhum aluno encontrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          />
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

  // Handler for masking inputs with YYYY.S format
  const handleYearSemesterFormat = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "periodoAcademico" | "turma"
  ) => {
    let value = e.target.value.replace(/[^\d.]/g, "") // Remove non-digit and non-dot characters

    // Handle backspace correctly (if the dot is the last character, remove it)
    if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === "deleteContentBackward") {
      if (value.endsWith(".")) {
        value = value.slice(0, -1)
      }
    }

    // If we have more than 4 digits and no dot yet, insert it
    if (value.length > 4 && !value.includes(".")) {
      value = value.slice(0, 4) + "." + value.slice(4)
    }

    // Limit the input after the dot to one digit
    if (value.includes(".")) {
      const [year, semester] = value.split(".")
      // Keep only first 4 digits for year
      const formattedYear = year.slice(0, 4)
      // Keep only first digit for semester
      const formattedSemester = semester.slice(0, 1)
      // Only allow 1 or 2 for semester
      if (formattedSemester && !["1", "2"].includes(formattedSemester)) {
        value = formattedYear + "."
      } else {
        value = formattedYear + (formattedSemester ? "." + formattedSemester : "")
      }
    } else {
      // Limit year to 4 digits
      value = value.slice(0, 4)
    }

    setValue(fieldName, value)
  }

  // Validation rules for YYYY.S format
  const yearSemesterValidationRules = {
    required: "Este campo é obrigatório",
    pattern: {
      value: /^\d{4}\.[12]$/,
      message: "Formato inválido. Use YYYY.S (S=1 ou 2)",
    },
    validate: {
      validYear: (value: string) => {
        const year = parseInt(value.split(".")[0])
        const currentYear = new Date().getFullYear()
        return (year >= 2000 && year <= currentYear + 5) || `O ano deve estar entre 2000 e ${currentYear + 5}`
      },
      validSemester: (value: string) => {
        const semester = value.split(".")[1]
        return ["1", "2"].includes(semester) || "O semestre deve ser 1 ou 2"
      },
    },
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
                  placeholder="Ex: 2024.1"
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
            <p className="text-xs text-muted-foreground mt-1">Formato: Ano.Semestre (ex: 2024.1)</p>
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
            <Input
              id="dataRealizacao"
              type="date"
              {...register("dataRealizacao", {
                required: "Data é obrigatória",
                setValueAs: (value: string) => {
                  if (!value) return undefined
                  // Adiciona o T00:00:00 para evitar problemas de fuso horário
                  return new Date(`${value}T00:00:00`)
                },
                validate: (value) => {
                  if (!value) {
                    return "Data é obrigatória"
                  }
                  return true
                },
              })}
              aria-invalid={errors.dataRealizacao ? "true" : "false"}
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

const ReviewSection = () => {
  const { getValues } = useFormContext<BancaFormData>()
  const values = getValues()
  const cursoNomes = {
    "1": "Ciência da Computação",
    "2": "Sistemas de Informação",
  }

  // Buscar a lista de professores para mostrar o nome do orientador na revisão
  const { data: teachers } = useTeachers()

  // Encontrar o nome do orientador a partir do ID
  const orientador = teachers?.find((teacher) => Number(teacher.id) === Number(values.orientadorId))
  const orientadorNome = orientador ? `${orientador.nome}` : "Não selecionado"

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Revisão e Confirmação</h2>

      <div className="space-y-6 border rounded-lg p-4">
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-2">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Título do Trabalho</p>
              <p className="font-medium">{values.tituloTrabalho}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visibilidade</p>
              <p className="font-medium">{values.visible ? "Pública" : "Privada"}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Resumo</p>
            <p className="text-sm">{values.resumo}</p>
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Abstract</p>
            <p className="text-sm">{values.abstract}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2 mb-2">Informações do Autor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Autor</p>
              <p className="font-medium">{values.autor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matrícula</p>
              <p className="font-medium">{values.matricula}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Orientador</p>
            <p className="font-medium">{orientadorNome}</p>
            <p className="text-sm text-muted-foreground">{`(${orientador?.academicTitle})`}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-2">Metadados do Trabalho</h3>
          <KeywordsList keywords={values.palavrasChave} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">Turma</p>
              <p className="font-medium">{values.turma}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Curso</p>
              <p className="font-medium">{cursoNomes[String(values.cursoId) as keyof typeof cursoNomes]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Período Acadêmico</p>
              <p className="font-medium">{values.periodoAcademico}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium border-b pb-2 mb-2">Agendamento da Defesa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">
                {values.dataRealizacao
                  ? new Date(values.dataRealizacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })
                  : "Não definida"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="font-medium">{values.hora}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">Modalidade</p>
              <p className="font-medium">{values.modalidade === "local" ? "Presencial" : "Remoto"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{values.modalidade === "local" ? "Local" : "Link"}</p>
              <p className="font-medium">{values.local}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-muted-foreground mt-4">
        Verifique as informações acima e clique em "Salvar Defesa" para confirmar.
      </p>
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
