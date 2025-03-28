import { SelectAdapter as Select, TextFieldAdapter as TextField } from "@/Components/FormAdapters"
import useUser from "@/Hooks/Users/useUser"
import { useHistory } from "@/utils"
import { Save } from "lucide-react"
import { Box, Button, createTheme, Grid, MenuItem, ThemeProvider } from "@mui/material"
import Container from "@mui/material/Container"
import { useCallback, useEffect, useState } from "react"
import { Field, Form } from "react-final-form"
import ReactLoading from "react-loading"
import { makeStyles } from "tss-react/mui"
import "./styles.css"

function AccountSettings() {
  const [userId, setUserId] = useState<string | null>(null)
  const { user, loading, updateUser } = useUser(userId)
  const history = useHistory()

  useEffect(() => {
    // Safe access to localStorage in browser environment
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId"))
    }
  }, [])

  const goToHome = useCallback(() => {
    history.push("")
    window.location.reload()
  }, [history])

  const themeButton = createTheme({
    palette: {
      primary: {
        main: "#329F5B",
      },
    },
  })

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
      "& .MuiFormControl-root": {
        display: "flex",
      },
      "& .MuiSelect-select.MuiSelect-select": {
        textAlign: "left",
      },
    },
  })

  const classesGrid = styles()

  const submitForm = async (event) => {
    await updateUser(event)
    goToHome()
  }

  const validate = (values) => {
    const REQUIRED_FIELDS_VALIDATION = ["nome", "email", "universidade"]
    const MAX_LENGTH_VALIDATION = {
      nome: 255,
      email: 64,
      universidade: 64,
      registration_id: 9,
    }
    const errors = {}

    REQUIRED_FIELDS_VALIDATION.forEach((key) => {
      if (!values[key]) errors[key] = "Campo obrigatório"
    })

    Object.keys(MAX_LENGTH_VALIDATION).forEach((key) => {
      if (values[key] && values[key].length > MAX_LENGTH_VALIDATION[key])
        errors[key] = `O tamanho máximo deste campo é de ${MAX_LENGTH_VALIDATION[key]} caracteres.`
    })

    if (!user.role && !values.registration_id) errors.registration_id = "Campo obrigatório"

    return errors
  }

  return (
    <Container className="App">
      {loading || !user ? (
        <div className="center">
          <ReactLoading type={"spin"} color={"#41616c"} height={100} width={100} />
        </div>
      ) : (
        <div style={{ padding: 16, margin: "auto", maxWidth: 2000 }}>
          <Form
            onSubmit={submitForm}
            initialValues={user}
            validate={validate}
            render={({ handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2} className={classesGrid.root}>
                  <h2 className="account-settings-header">Editar Informações da Conta</h2>
                  <Grid item xs={12} alignItems="flex-start">
                    <Field fullWidth Obrigatório name="nome" component={TextField} type="text" label="Nome completo" />
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="pronoun" component={Select} label="Gênero">
                      <MenuItem value="0" alignItems="flex-start">
                        Masculino
                      </MenuItem>
                      <MenuItem value="1" alignItems="flex-start">
                        Feminino
                      </MenuItem>
                    </Field>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      Obrigatório
                      multiline
                      name="email"
                      component={TextField}
                      type="text"
                      label="Email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      Obrigatório
                      multiline
                      name="universidade"
                      component={TextField}
                      type="text"
                      label="Universidade"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      Obrigatório
                      multiline
                      name="academic_title"
                      component={TextField}
                      type="text"
                      label="Título acadêmico"
                    />
                  </Grid>
                  {!user.role && (
                    <Grid item xs={12}>
                      <Field
                        fullWidth
                        multiline
                        name="registration_id"
                        component={TextField}
                        type="text"
                        label="Matrícula"
                      />
                    </Grid>
                  )}
                  <Grid item style={{ marginTop: 16 }} xs={12}>
                    <Box display="flex" alignItems="flex-end" justifyContent="flex-end">
                      <ThemeProvider theme={themeButton}>
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          disabled={submitting}
                          startIcon={<Save />}
                        >
                          Salvar Alterações
                        </Button>
                      </ThemeProvider>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            )}
          />
        </div>
      )}
    </Container>
  )
}

export default AccountSettings
