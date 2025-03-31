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
import { rpcReturn, type RpcType } from "@/lib/utils"
import apiClient from "@/services/apiClient"
import { useMutation } from "@tanstack/react-query"
import type { InsertBanca } from "@tcc/server"
import { Controller, useForm, useFormContext } from "react-hook-form"
import { useNavigate } from "react-router"

type query = RpcType<typeof apiClient.banca.$post>

type BancaFormData = InsertBanca & {
  visible: boolean
  hora: string
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
  ano: "2024",
  dataRealizacao: new Date("2024-01-01"),
  hora: "14:00",
  semestreLetivo: "2",
  modalidade: "local",
  local: "Sala H-101",
}

const useAddBancaMutation = () => {
  return useMutation({
    mutationFn: async (data: query["input"]) => rpcReturn(await apiClient.banca.$post(data)),
  })
}

export default function AddBancaPage() {
  const navigate = useNavigate()

  const form = useForm<BancaFormData>({
    defaultValues: {
      visible: false,
      modalidade: "local",
      semestreLetivo: undefined,
      cursoId: undefined,
    },
  })

  const addBancaMutation = useAddBancaMutation()

  const onSubmit = (data: BancaFormData) => {
    const submissionData: query["input"]["json"] = {
      ...data,
      matricula: data.matricula || "",
      cursoId: Number(data.cursoId),
      ano: data.ano,
      visible: Boolean(data.visible),
    }

    console.log("Submitting data:", submissionData)
    addBancaMutation.mutate({ json: submissionData })
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <h1 className="text-2xl font-bold mb-6">Cadastrar Nova Defesa de TCC</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
          <div className="space-y-4">
            <BasicInfoSection />
            <AuthorInfoSection />
            <WorkMetadataSection />
            <DefenseSchedulingSection />
          </div>
          <div className="flex justify-between items-center pt-4">
            {process.env.NODE_ENV === "development" && <DevFillButton />}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Defesa</Button>
            </div>
          </div>
        </form>
      </Form>
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
          rows={4}
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
          rows={4}
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
    formState: { errors },
  } = useFormContext<BancaFormData>()
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="autor">Autor</Label>
        <Input
          id="autor"
          {...register("autor", { required: isUserTeacher ? "Autor é obrigatório" : false })}
          placeholder="Nome do Aluno"
          aria-invalid={errors.autor ? "true" : "false"}
          disabled={!isUserTeacher}
        />
        {errors.autor && <p className="text-sm text-red-600 mt-1">{errors.autor.message}</p>}
      </div>
      <div>
        <Label htmlFor="matricula">Matrícula</Label>
        <Input
          id="matricula"
          {...register("matricula", { required: isUserTeacher ? "Matrícula é obrigatória" : false })}
          placeholder="Matrícula"
          aria-invalid={errors.matricula ? "true" : "false"}
          disabled={!isUserTeacher}
        />
        {errors.matricula && <p className="text-sm text-red-600 mt-1">{errors.matricula.message}</p>}
      </div>
    </div>
  )
}

const WorkMetadataSection = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BancaFormData>()
  return (
    <>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="turma">Turma</Label>
          <Input
            id="turma"
            {...register("turma", { required: "Turma é obrigatória" })}
            placeholder="Ex: 2024/1"
            aria-invalid={errors.turma ? "true" : "false"}
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
          <Label htmlFor="ano">Ano</Label>
          <Input
            id="ano"
            type="number"
            {...register("ano", {
              required: "Ano é obrigatório",
              pattern: {
                value: /^\d{4}$/,
                message: "Ano inválido (ex: 2024)",
              },
            })}
            placeholder="Ex: 2024"
            aria-invalid={errors.ano ? "true" : "false"}
          />
          {errors.ano && <p className="text-sm text-red-600 mt-1">{errors.ano.message}</p>}
        </div>
      </div>
    </>
  )
}

const DefenseSchedulingSection = () => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<BancaFormData>()
  const modalidadeValue = watch("modalidade")
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="data_realizacao">Data da Defesa</Label>
          <Input
            id="dataRealizacao"
            type="date"
            {...register("dataRealizacao", { required: "Data é obrigatória" })}
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
        <div>
          <Label htmlFor="semestre_letivo">Semestre Letivo</Label>
          <Controller
            name="semestreLetivo"
            control={control}
            rules={{ required: "Semestre letivo é obrigatório" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger
                  id="semestre_letivo"
                  ref={field.ref}
                  aria-invalid={errors.semestreLetivo ? "true" : "false"}
                >
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Semestre</SelectItem>
                  <SelectItem value="2">2º Semestre</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.semestreLetivo && <p className="text-sm text-red-600 mt-1">{errors.semestreLetivo.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
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
    </>
  )
}

const DevFillButton = () => {
  const { reset } = useFormContext<BancaFormData>()

  const handleFill = () => {
    const formDataForReset: Partial<BancaFormData> = {
      ...DEV_SEED_DATA,
      ano: DEV_SEED_DATA.ano?.toString(),
      cursoId: DEV_SEED_DATA.cursoId || 1,
      semestreLetivo: DEV_SEED_DATA.semestreLetivo?.toString(),
      visible: Boolean(DEV_SEED_DATA.visible),
    }
    reset(formDataForReset as unknown as BancaFormData)
  }

  return (
    <Button type="button" variant="secondary" onClick={handleFill}>
      Fill Form (Dev)
    </Button>
  )
}
