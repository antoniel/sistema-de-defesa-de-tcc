"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useIsTeacher from "@/hooks/use-role"
// TODO: Import Calendar and Popover for DatePicker
import { Controller, type SubmitHandler, useForm } from "react-hook-form" // Import react-hook-form
import { useNavigate } from "react-router"

// Placeholder function for teacher check - replace with actual auth logic

// Define the type for our form data
interface BancaFormData {
  titulo_trabalho: string
  visible: boolean
  resumo: string
  abstract: string
  autor?: string // Optional because it depends on role
  matricula?: string // Optional because it depends on role
  pronome_autor?: string // Optional because it depends on role
  id_orientador?: string // Optional because it depends on role
  palavras_chave: string // Keep as string, process on submit
  turma: string
  id_curso: string
  tipo_banca: "remoto" | "local"
  ano: string // Keep as string, process on submit
  semestre_letivo: string
  local: string
  data_realizacao: string // Keep as string from input type=date
  hora: string // Keep as string from input type=time
  // Add board members later
  // id_membros: ...
}

export default function AddBancaPage() {
  const navigate = useNavigate()
  const isUserTeacher = useIsTeacher() // Determine role once

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<BancaFormData>({
    defaultValues: {
      titulo_trabalho: "",
      visible: isUserTeacher, // Default based on role
      resumo: "",
      abstract: "",
      autor: "",
      matricula: "",
      pronome_autor: undefined,
      id_orientador: undefined,
      palavras_chave: "",
      turma: "",
      id_curso: undefined,
      tipo_banca: "local", // Default to 'local'
      ano: "",
      semestre_letivo: undefined,
      local: "",
      data_realizacao: "",
      hora: "",
    },
  })

  const tipoBancaValue = watch("tipo_banca") // Watch for conditional logic/UI

  const onSubmit: SubmitHandler<BancaFormData> = (data) => {
    // Combine date and time - Adjust if using proper pickers
    const combinedDateTime =
      data.data_realizacao && data.hora
        ? `${new Date(data.data_realizacao + "T00:00:00").toISOString().split("T")[0]}T${data.hora}:00.000Z` // Basic combination
        : null
    console.log("Raw form data:", data) // Log raw data
    console.log("CombinedDateTime (ISO String):", combinedDateTime) // Example, adjust based on final picker implementation

    const formDataToSubmit = {
      titulo_trabalho: data.titulo_trabalho,
      visible: data.visible,
      resumo: data.resumo,
      abstract: data.abstract,
      // Conditionally include fields based on role
      ...(isUserTeacher
        ? { autor: data.autor, matricula: data.matricula, pronome_autor: data.pronome_autor }
        : { id_orientador: data.id_orientador }),
      palavras_chave: data.palavras_chave.split(",").map((k) => k.trim()), // Process keywords
      turma: data.turma,
      id_curso: data.id_curso,
      tipo_banca: data.tipo_banca,
      ano: Number(data.ano) || null, // Convert to number
      semestre_letivo: data.semestre_letivo ? Number(data.semestre_letivo) : null, // Convert to number
      local: data.local, // Use directly, placeholder adjusts based on tipoBancaValue
      data_realizacao: combinedDateTime, // Send combined date/time
      // Add id_membros for board members later
    }
    console.log("Processed Form Data for API:", formDataToSubmit)
    // TODO: Call API using React Query mutation
    // Example: addBancaMutation.mutate(formDataToSubmit)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <h1 className="text-2xl font-bold mb-6">Cadastrar Nova Defesa de TCC</h1>

      {/* Use handleSubmit from react-hook-form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
        {/* --- Form Fields --- */}

        <div className="grid grid-cols-1 gap-4">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <Label htmlFor="titulo_trabalho">Título do Trabalho</Label>
              <Textarea
                id="titulo_trabalho"
                {...register("titulo_trabalho", { required: "Título é obrigatório" })}
                placeholder="Título completo do trabalho"
                rows={2}
                aria-invalid={errors.titulo_trabalho ? "true" : "false"}
              />
              {errors.titulo_trabalho && <p className="text-sm text-red-600 mt-1">{errors.titulo_trabalho.message}</p>}
            </div>
            {/* Visibility (Teacher Only) */}
            {isUserTeacher && (
              <Controller
                name="visible"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="visible"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      ref={field.ref} // Pass ref
                    />
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

          {/* Resumo */}
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

          {/* Abstract */}
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

          {/* --- Role-Specific Fields --- */}
          {isUserTeacher ? (
            <>
              {/* Autor (Teacher) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    {...register("autor", { required: isUserTeacher ? "Autor é obrigatório" : false })}
                    placeholder="Nome do Aluno"
                    aria-invalid={errors.autor ? "true" : "false"}
                  />
                  {errors.autor && <p className="text-sm text-red-600 mt-1">{errors.autor.message}</p>}
                </div>
                {/* Matrícula (Teacher) */}
                <div>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    {...register("matricula", { required: isUserTeacher ? "Matrícula é obrigatória" : false })}
                    placeholder="Matrícula"
                    aria-invalid={errors.matricula ? "true" : "false"}
                  />
                  {errors.matricula && <p className="text-sm text-red-600 mt-1">{errors.matricula.message}</p>}
                </div>
                {/* Pronome Autor (Teacher) */}
                <div>
                  <Label htmlFor="pronome_autor">Gênero (Autor)</Label>
                  <Controller
                    name="pronome_autor"
                    control={control}
                    rules={{ required: isUserTeacher ? "Gênero do autor é obrigatório" : false }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <SelectTrigger
                          id="pronome_autor"
                          ref={field.ref}
                          aria-invalid={errors.pronome_autor ? "true" : "false"}
                        >
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Masculino</SelectItem>
                          <SelectItem value="1">Feminino</SelectItem>
                          {/* Add other options if needed */}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.pronome_autor && <p className="text-sm text-red-600 mt-1">{errors.pronome_autor.message}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Orientador (Student) */}
              <div>
                <Label htmlFor="docente">Orientador</Label>
                <Controller
                  name="id_orientador"
                  control={control}
                  rules={{ required: !isUserTeacher ? "Orientador é obrigatório" : false }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <SelectTrigger
                        id="docente"
                        ref={field.ref}
                        aria-invalid={errors.id_orientador ? "true" : "false"}
                      >
                        <SelectValue placeholder="Selecione o orientador..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* TODO: Fetch and map teachers */}
                        <SelectItem value="placeholder-teacher-1">Professor Placeholder 1</SelectItem>
                        <SelectItem value="placeholder-teacher-2">Professor Placeholder 2</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.id_orientador && <p className="text-sm text-red-600 mt-1">{errors.id_orientador.message}</p>}
              </div>
            </>
          )}

          {/* Palavras Chave */}
          <div>
            <Label htmlFor="palavras_chave">Palavras Chave</Label>
            <Input
              id="palavras_chave"
              {...register("palavras_chave", { required: "Palavras-chave são obrigatórias" })}
              placeholder="Separadas por vírgula"
              aria-invalid={errors.palavras_chave ? "true" : "false"}
            />
            {errors.palavras_chave && <p className="text-sm text-red-600 mt-1">{errors.palavras_chave.message}</p>}
            <p className="text-sm text-muted-foreground">Separe as palavras-chave por vírgula (,).</p>
          </div>

          {/* --- Course and Class --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Turma */}
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
            {/* Curso */}
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Controller
                name="id_curso"
                control={control}
                rules={{ required: "Curso é obrigatório" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="curso" ref={field.ref} aria-invalid={errors.id_curso ? "true" : "false"}>
                      <SelectValue placeholder="Selecione o curso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Fetch and map courses */}
                      <SelectItem value="placeholder-course-1">Curso Placeholder 1 (CC)</SelectItem>
                      <SelectItem value="placeholder-course-2">Curso Placeholder 2 (SI)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.id_curso && <p className="text-sm text-red-600 mt-1">{errors.id_curso.message}</p>}
            </div>
            {/* Ano */}
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number" // Use type="number" but register handles value
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

          {/* --- Date, Time, Location --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Data */}
            <div>
              <Label htmlFor="data_realizacao">Data da Defesa</Label>
              {/* TODO: Replace with Shadcn Date Picker Popover */}
              <Input
                id="data_realizacao"
                type="date"
                {...register("data_realizacao", { required: "Data é obrigatória" })}
                aria-invalid={errors.data_realizacao ? "true" : "false"}
              />
              {errors.data_realizacao && <p className="text-sm text-red-600 mt-1">{errors.data_realizacao.message}</p>}
            </div>
            {/* Hora */}
            <div>
              <Label htmlFor="hora">Hora da Defesa</Label>
              {/* TODO: Replace with Shadcn Time Picker */}
              <Input
                id="hora"
                type="time"
                {...register("hora", { required: "Hora é obrigatória" })}
                aria-invalid={errors.hora ? "true" : "false"}
              />
              {errors.hora && <p className="text-sm text-red-600 mt-1">{errors.hora.message}</p>}
            </div>
            {/* Semestre Letivo */}
            <div>
              <Label htmlFor="semestre_letivo">Semestre Letivo</Label>
              <Controller
                name="semestre_letivo"
                control={control}
                rules={{ required: "Semestre letivo é obrigatório" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger
                      id="semestre_letivo"
                      ref={field.ref}
                      aria-invalid={errors.semestre_letivo ? "true" : "false"}
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
              {errors.semestre_letivo && <p className="text-sm text-red-600 mt-1">{errors.semestre_letivo.message}</p>}
            </div>
          </div>

          {/* --- Type and Location/Link --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Tipo Banca */}
            <div className="md:col-span-1">
              <Label>Tipo de Banca</Label>
              <Controller
                name="tipo_banca"
                control={control}
                rules={{ required: true }} // Usually required
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="local"
                    className="flex space-x-4 pt-2"
                    ref={field.ref} // Pass ref to the group container or first item if needed
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
            {/* Local/Link */}
            <div className="md:col-span-2">
              <Label htmlFor="local">{tipoBancaValue === "remoto" ? "Link da Reunião" : "Local Físico"}</Label>
              <Input
                id="local"
                {...register("local", { required: "Local/Link é obrigatório" })}
                placeholder={tipoBancaValue === "remoto" ? "https://meet.google.com/..." : "Ex: Sala H-101"}
                aria-invalid={errors.local ? "true" : "false"}
              />
              {errors.local && <p className="text-sm text-red-600 mt-1">{errors.local.message}</p>}
            </div>
          </div>

          {/* TODO: Add fields for Membros da Banca (Examiners) - likely needs a dynamic list component */}
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")}>
            Cancelar
          </Button>
          {/* TODO: Add loading state to submit button, disable while submitting */}
          <Button type="submit">Salvar Defesa</Button>
        </div>
      </form>
    </div>
  )
}
