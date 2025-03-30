"use client"

import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import React, { useState } from "react"
// TODO: Import Calendar and Popover for DatePicker
import { useNavigate } from "react-router"

// Placeholder function for teacher check - replace with actual auth logic
const isTeacher = () => true

export default function AddBancaPage() {
  const navigate = useNavigate()

  // --- State Variables ---
  const [tituloTrabalho, setTituloTrabalho] = useState("")
  const [visible, setVisible] = useState(isTeacher()) // Default based on role
  const [resumo, setResumo] = useState("")
  const [abstract, setAbstract] = useState("")
  // Teacher-specific fields
  const [autor, setAutor] = useState("")
  const [matricula, setMatricula] = useState("")
  const [pronomeAutor, setPronomeAutor] = useState<string>()
  // Student-specific field (placeholder)
  const [docenteId, setDocenteId] = useState<string>()
  // Common fields
  const [palavrasChave, setPalavrasChave] = useState("")
  const [turma, setTurma] = useState("")
  const [cursoId, setCursoId] = useState<string>()
  const [tipoBanca, setTipoBanca] = useState<"remoto" | "local">("local") // Default to 'local'
  const [ano, setAno] = useState("")
  const [semestreLetivo, setSemestreLetivo] = useState<string>()
  const [local, setLocal] = useState("")
  const [dataRealizacao, setDataRealizacao] = useState<Date | undefined>() // TODO: Use Shadcn Date Picker state
  const [hora, setHora] = useState("") // TODO: Use a Time Picker component/state

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Combine date and time - More robust logic needed with actual pickers
    const combinedDateTime = dataRealizacao ? `${dataRealizacao.toISOString().split("T")[0]}T${hora}:00.000Z` : null
    console.log("CombinedDateTime (ISO String):", combinedDateTime) // Example, adjust based on final picker implementation

    const formData = {
      titulo_trabalho: tituloTrabalho,
      visible,
      resumo,
      abstract,
      // Conditionally include fields based on role
      ...(isTeacher() ? { autor, matricula, pronome_autor: pronomeAutor } : { id_orientador: docenteId }), // Assuming 'docenteId' maps to 'id_orientador' in backend
      palavras_chave: palavrasChave.split(",").map((k) => k.trim()), // Assuming backend wants an array
      turma,
      id_curso: cursoId, // Assuming 'cursoId' maps to 'id_curso'
      tipo_banca: tipoBanca,
      ano: Number(ano) || null, // Convert to number, handle potential NaN
      semestre_letivo: semestreLetivo ? Number(semestreLetivo) : null,
      local: tipoBanca === "remoto" ? local : local, // Backend might expect URL or physical address based on type
      data_realizacao: combinedDateTime, // Send combined date/time
      // Add id_membros for board members later
    }
    console.log("Form Data:", formData)
    // TODO: Call API using React Query mutation
    // Example: addBancaMutation.mutate(formData)
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header className="mb-6" />
      <h1 className="text-2xl font-bold mb-6">Cadastrar Nova Defesa de TCC</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* --- Form Fields --- */}

        <div className="grid grid-cols-1 gap-4">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <Label htmlFor="titulo_trabalho">Título do Trabalho</Label>
              <Textarea
                id="titulo_trabalho"
                value={tituloTrabalho}
                onChange={(e) => setTituloTrabalho(e.target.value)}
                placeholder="Título completo do trabalho"
                required
                rows={2}
              />
            </div>
            {/* Visibility (Teacher Only) */}
            {isTeacher() && (
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="visible" checked={visible} onCheckedChange={(checked) => setVisible(Boolean(checked))} />
                <Label
                  htmlFor="visible"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap"
                >
                  {visible ? "Pública" : "Privada"}
                </Label>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div>
            <Label htmlFor="resumo">Resumo</Label>
            <Textarea
              id="resumo"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder="Resumo em português"
              required
              rows={4}
            />
          </div>

          {/* Abstract */}
          <div>
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Abstract in English"
              required
              rows={4}
            />
          </div>

          {/* --- Role-Specific Fields --- */}
          {isTeacher() ? (
            <>
              {/* Autor (Teacher) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    placeholder="Nome do Aluno"
                    required={isTeacher()}
                  />
                </div>
                {/* Matrícula (Teacher) */}
                <div>
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Matrícula"
                    required={isTeacher()}
                  />
                </div>
                {/* Pronome Autor (Teacher) */}
                <div>
                  <Label htmlFor="pronome_autor">Gênero (Autor)</Label>
                  <Select value={pronomeAutor} onValueChange={setPronomeAutor} required={isTeacher()}>
                    <SelectTrigger id="pronome_autor">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Masculino</SelectItem>
                      <SelectItem value="1">Feminino</SelectItem>
                      {/* Add other options if needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Orientador (Student) */}
              <div>
                <Label htmlFor="docente">Orientador</Label>
                <Select value={docenteId} onValueChange={setDocenteId} required={!isTeacher()}>
                  <SelectTrigger id="docente">
                    <SelectValue placeholder="Selecione o orientador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Fetch and map teachers */}
                    <SelectItem value="placeholder-teacher-1">Professor Placeholder 1</SelectItem>
                    <SelectItem value="placeholder-teacher-2">Professor Placeholder 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Palavras Chave */}
          <div>
            <Label htmlFor="palavras_chave">Palavras Chave</Label>
            <Input
              id="palavras_chave"
              value={palavrasChave}
              onChange={(e) => setPalavrasChave(e.target.value)}
              placeholder="Separadas por vírgula"
              required
            />
            <p className="text-sm text-muted-foreground">Separe as palavras-chave por vírgula (,).</p>
          </div>

          {/* --- Course and Class --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Turma */}
            <div>
              <Label htmlFor="turma">Turma</Label>
              <Input
                id="turma"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                placeholder="Ex: 2024/1"
                required
              />
            </div>
            {/* Curso */}
            <div>
              <Label htmlFor="curso">Curso</Label>
              <Select value={cursoId} onValueChange={setCursoId} required>
                <SelectTrigger id="curso">
                  <SelectValue placeholder="Selecione o curso..." />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Fetch and map courses */}
                  <SelectItem value="placeholder-course-1">Curso Placeholder 1 (CC)</SelectItem>
                  <SelectItem value="placeholder-course-2">Curso Placeholder 2 (SI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Ano */}
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="Ex: 2024"
                required
              />
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
                onChange={(e) => setDataRealizacao(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                required
              />
            </div>
            {/* Hora */}
            <div>
              <Label htmlFor="hora">Hora da Defesa</Label>
              {/* TODO: Replace with Shadcn Time Picker */}
              <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
            {/* Semestre Letivo */}
            <div>
              <Label htmlFor="semestre_letivo">Semestre Letivo</Label>
              <Select value={semestreLetivo} onValueChange={setSemestreLetivo} required>
                <SelectTrigger id="semestre_letivo">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Semestre</SelectItem>
                  <SelectItem value="2">2º Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- Type and Location/Link --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Tipo Banca */}
            <div className="md:col-span-1">
              <Label>Tipo de Banca</Label>
              <RadioGroup
                defaultValue="local"
                value={tipoBanca}
                onValueChange={(value: "remoto" | "local") => setTipoBanca(value)}
                className="flex space-x-4 pt-2"
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
            </div>
            {/* Local/Link */}
            <div className="md:col-span-2">
              <Label htmlFor="local">{tipoBanca === "remoto" ? "Link da Reunião" : "Local Físico"}</Label>
              <Input
                id="local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={tipoBanca === "remoto" ? "https://meet.google.com/..." : "Ex: Sala H-101"}
                required
              />
            </div>
          </div>

          {/* TODO: Add fields for Membros da Banca (Examiners) - likely needs a dynamic list component */}
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Defesa</Button>
          {/* TODO: Add loading state to submit button */}
        </div>
      </form>
    </div>
  )
}
