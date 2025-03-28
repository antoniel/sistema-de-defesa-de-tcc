import api from "@/Config/http"
import { isTeacher } from "@/Helpers/role"
import useTeachers from "@/Hooks/Users/useTeachers"
import { useHistory } from "@/utils"
import { DatePicker, TimePicker } from "@mui/lab"
import {
  Button,
  Checkbox,
  createTheme,
  CssBaseline,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio as MuiRadio,
  Select as MuiSelect,
  TextField as MuiTextField,
  ThemeProvider,
} from "@mui/material"
import Container from "@mui/material/Container"
import { default as AdapterDateFns, default as LocalizationProvider } from "@mui/x-date-pickers"
import type { MouseEvent, ReactNode } from "react"
import { useEffect, useState } from "react"
import type { FieldRenderProps } from "react-final-form"
import { Field, Form } from "react-final-form"
import ReactLoading from "react-loading"
import { toast } from "react-toastify"
import { makeStyles } from "tss-react/mui"
import "./styles.css"

/*
  Componente responsável pela página de criação de bancas
*/

// Custom Field Adapter interfaces
interface FieldMetaState {
  active?: boolean
  data?: any
  dirty?: boolean
  dirtySinceLastSubmit?: boolean
  error?: any
  initial?: any
  invalid?: boolean
  pristine?: boolean
  submitError?: any
  submitFailed?: boolean
  submitSucceeded?: boolean
  submitting?: boolean
  touched?: boolean
  valid?: boolean
  visited?: boolean
}

interface TextFieldProps extends FieldRenderProps<string, HTMLElement> {
  label?: string
  fullWidth?: boolean
  multiline?: boolean
  type?: string
}

interface SelectFieldProps extends FieldRenderProps<string, HTMLElement> {
  label?: string
  formControlProps?: any
  children: ReactNode
  loading?: boolean
}

interface RadioFieldProps extends FieldRenderProps<string, HTMLElement> {
  value: string
  type: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
}

function ExaminingBoard() {
  const { loading: loadingTeachers, users: teachers } = useTeachers()
  const [tipo_banca, setTipo_banca] = useState(true)
  const [loading, setLoading] = useState(false)
  const [cursos, setCursos] = useState([])
  const history = useHistory()

  useEffect(() => {
    api.get("cursos").then(({ data: { data } }) => setCursos(data))
  }, [])

  const goToDashboard = () => {
    let path = `dashboard`
    history.push(path)
  }

  // Custom Field Adapters for Material-UI
  const TextFieldAdapter = ({ input, meta, ...rest }: TextFieldProps) => {
    const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched
    return (
      <MuiTextField
        {...input}
        {...rest}
        error={showError}
        helperText={showError ? meta.error || meta.submitError : undefined}
      />
    )
  }

  const SelectAdapter = ({ input, meta, children, formControlProps, ...rest }: SelectFieldProps) => {
    const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched
    return (
      <MuiSelect
        {...input}
        {...rest}
        error={showError}
        inputProps={rest}
        onChange={(e) => input.onChange(e.target.value)}
        FormHelperTextProps={{ error: showError }}
        {...formControlProps}
      >
        {children}
      </MuiSelect>
    )
  }

  const RadioAdapter = ({ input, ...rest }: RadioFieldProps) => {
    const { onClick, ...radioProps } = rest
    return (
      <MuiRadio
        {...input}
        {...radioProps}
        checked={input.value === rest.value}
        onChange={(e) => {
          input.onChange(e)
          if (onClick) {
            onClick(e as any)
          }
        }}
      />
    )
  }

  function DatePickerWrapper(props) {
    const {
      input: { name, onChange, value, ...restInput },
      meta,
      ...rest
    } = props
    const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched

    return (
      <DatePicker
        {...rest}
        name={name}
        format="dd/MM/yyyy"
        helperText={showError ? meta.error || meta.submitError : undefined}
        error={showError}
        inputProps={restInput}
        onChange={onChange}
        value={value === "" ? null : value}
      />
    )
  }

  function TimePickerWrapper(props) {
    const {
      input: { name, onChange, value, ...restInput },
      meta,
      ...rest
    } = props
    const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched

    return (
      <TimePicker
        {...rest}
        name={name}
        helperText={showError ? meta.error || meta.submitError : undefined}
        error={showError}
        inputProps={restInput}
        onChange={onChange}
        value={value === "" ? null : value}
      />
    )
  }

  const theme = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#329F5B",
        dark: "#184e2d",
        contrastText: "#fff",
      },
      secondary: {
        light: "#ff7961",
        main: "#6c7ae0",
        dark: "#002884",
        contrastText: "#fff",
      },
    },
  })

  const handleChange = (e) => {
    const { value } = e.target
    if (value === "remoto") {
      setTipo_banca(false)
    } else if (value === "local") {
      setTipo_banca(true)
    }
  }

  const onSubmit = async (values) => {
    const hour = new Date(values.hora)
    const date = new Date(values.data_realizacao)

    // Check if we're in browser environment before accessing localStorage
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId")
      values.user_id = userId
    }

    hour.setHours(hour.getHours() - 3)
    hour.setDate(date.getDate())
    hour.setMonth(date.getMonth())
    hour.setFullYear(date.getFullYear())
    values.data_realizacao = hour.toISOString().slice(0, 19).replace("T", " ")
    values.visible = values.visible ? 1 : 0
    setLoading(true)

    api
      .post("/banca", values)
      .then(function () {
        setLoading(false)
        goToDashboard()
      })
      .catch(() => {
        setLoading(false)
        toast.error("Ocorreu um erro ao tentar cadastrar a banca")
      })
  }

  const validate = (values) => {
    const REQUIRED_FIELDS_VALIDATION = [
      "titulo_trabalho",
      "resumo",
      "abstract",
      "palavras_chave",
      "data_realizacao",
      "hora",
      "local",
      "curso",
      "tipo_banca",
      "turma",
      "ano",
      "semestre_letivo",
    ]

    const FIELD_LENGHT_VALIDATION = {
      titulo_trabalho: 255,
      resumo: 4096,
      abstract: 4096,
      palavras_chave: 512,
      local: 255,
      tipo_banca: 10,
      autor: 255,
      matricula: 10,
      turma: 45,
      ano: 4,
    }

    const errors = {}

    REQUIRED_FIELDS_VALIDATION.forEach((key) => {
      if (!values[key]) errors[key] = "Obrigatório"
    })

    Object.keys(FIELD_LENGHT_VALIDATION).forEach((key) => {
      if (values[key] && values[key].length > FIELD_LENGHT_VALIDATION[key])
        errors[key] = `O tamanho máximo deste campo é de ${FIELD_LENGHT_VALIDATION[key]} caracteres.`
    })

    if (isTeacher() && !values.autor) {
      errors.autor = "Obrigatório"
    }
    if (isTeacher() && values.pronome_autor !== 0 && !values.pronome_autor) {
      errors.pronome_autor = "Obrigatório"
    }
    if (isTeacher() && !values.matricula) {
      errors.matricula = "Obrigatório"
    }

    if (values.ano && !Number(values.ano)) errors.ano = "Insira um valor válido"

    return errors
  }

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
    },
  })

  const classesGrid = styles()

  return (
    <Container className="App banca-form-container">
      {loading ? (
        <div className="center">
          <ReactLoading type={"spin"} color={"#41616c"} height={50} width={50} />
        </div>
      ) : null}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          maxWidth: 3000,
        }}
      >
        <CssBaseline />
        <h2 className="banca-form-header">Adicionar Nova Banca</h2>
        <Form
          onSubmit={onSubmit}
          initialValues={{ visible: isTeacher() }}
          validate={validate}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit} noValidate>
              <Grid container alignItems="flex-start" spacing={2} className={classesGrid.root}>
                <Grid item xs={isTeacher() ? 10 : 12}>
                  <Field
                    fullWidth
                    Obrigatório
                    multiline
                    name="titulo_trabalho"
                    component={TextFieldAdapter}
                    type="text"
                    label="Título"
                  />
                </Grid>
                {isTeacher() && (
                  <Grid
                    xs={2}
                    item
                    alignItems="flex-start"
                    justifyContent="flex-start"
                    style={{
                      padding: 0,
                      marginTop: "auto",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Field name="visible" onClick={handleChange}>
                      {({ input }) => (
                        <FormControlLabel
                          control={<Checkbox checked={input.value} onChange={input.onChange} />}
                          label={`Visibilidade: ${input.value ? "Pública" : "Privada"}`}
                        />
                      )}
                    </Field>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Field
                    fullWidth
                    Obrigatório
                    multiline
                    name="resumo"
                    component={TextFieldAdapter}
                    type="text"
                    label="Resumo"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    name="abstract"
                    fullWidth
                    multiline
                    Obrigatório
                    component={TextFieldAdapter}
                    label="Abstract"
                  />
                </Grid>
                {isTeacher() ? (
                  <>
                    <Grid item xs={6}>
                      <Field name="autor" fullWidth Obrigatório component={TextFieldAdapter} label="Autor" />
                    </Grid>
                    <Grid item xs={3}>
                      <Field name="matricula" fullWidth Obrigatório component={TextFieldAdapter} label="Matrícula" />
                    </Grid>
                    <Grid item xs={3}>
                      <Field
                        component={SelectAdapter}
                        label="Gênero"
                        name="pronome_autor"
                        formControlProps={{ className: "curso" }}
                      >
                        <MenuItem value="0" alignItems="flex-start">
                          Masculino
                        </MenuItem>
                        <MenuItem value="1" alignItems="flex-start">
                          Feminino
                        </MenuItem>
                      </Field>
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Field
                      name="docente"
                      loading={loadingTeachers}
                      component={SelectAdapter}
                      label="Orientador"
                      formControlProps={{ className: "curso" }}
                    >
                      {teachers.map(({ id, nome }) => (
                        <MenuItem value={id} key={id}>
                          {nome}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Field
                    name="palavras_chave"
                    fullWidth
                    Obrigatório
                    multiline
                    component={TextFieldAdapter}
                    label="Palavras Chave (Separadas por vírgula)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field name="turma" fullWidth Obrigatório component={TextFieldAdapter} label="Turma" />
                </Grid>
                <Grid item xs={4}>
                  <Field name="curso" label="Curso" formControlProps={{ className: "curso" }} component={SelectAdapter}>
                    {cursos.map(({ id, sigla }) => (
                      <MenuItem key={id} value={id}>
                        {sigla}
                      </MenuItem>
                    ))}
                  </Field>
                </Grid>
                <Grid style={{ padding: 0, marginTop: "auto", fontSize: "13px" }} item xs={2}>
                  Remoto
                  <Field
                    name="tipo_banca"
                    component={RadioAdapter}
                    type="radio"
                    value="remoto"
                    onClick={handleChange}
                  ></Field>
                  Presencial
                  <Field
                    name="tipo_banca"
                    component={RadioAdapter}
                    type="radio"
                    value="local"
                    onClick={handleChange}
                  ></Field>
                </Grid>
                <Grid item xs={3}>
                  <Field name="ano" multiline fullWidth Obrigatório component={TextFieldAdapter} label="Ano" />
                </Grid>
                <Grid item xs={3}>
                  <Field
                    component={SelectAdapter}
                    label="Semestre Letivo"
                    name="semestre_letivo"
                    formControlProps={{ className: "curso" }}
                  >
                    <MenuItem value="1" alignItems="flex-start">
                      Primeiro Semestre
                    </MenuItem>
                    <MenuItem value="2" alignItems="flex-start">
                      Segundo Semestre
                    </MenuItem>
                  </Field>
                </Grid>
                <Grid item xs={6}>
                  <Field
                    name="local"
                    multiline
                    fullWidth
                    Obrigatório
                    component={TextFieldAdapter}
                    label={tipo_banca ? "Local" : "Link"}
                  />
                </Grid>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid item xs={6}>
                    <Field
                      name="data_realizacao"
                      component={DatePickerWrapper}
                      Obrigatório
                      fullWidth
                      margin="normal"
                      label="Data"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Field
                      name="hora"
                      Obrigatório
                      component={TimePickerWrapper}
                      fullWidth
                      margin="normal"
                      label="Hora"
                    />
                  </Grid>
                </LocalizationProvider>
                <Grid item style={{ marginTop: 16 }}>
                  <ThemeProvider theme={theme}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={submitting}
                      style={{ borderRadius: 10 }}
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      type="button"
                      disabled={submitting}
                      onClick={goToDashboard}
                      style={{ marginLeft: 10, borderRadius: 10 }}
                    >
                      Voltar
                    </Button>
                  </ThemeProvider>
                </Grid>
              </Grid>
            </form>
          )}
        />
      </div>
    </Container>
  )
}
export default ExaminingBoard
