import {
  Button,
  Container,
  Grid,
  MenuItem,
  ThemeProvider,
  createTheme,
  makeStyles,
} from "@material-ui/core";
import { Select, TextField } from "final-form-material-ui";
import { isEmailValid } from "Helpers/validators";
import React from "react";
import { Field, Form } from "react-final-form";
import ReactLoading from "react-loading";

function UserForm({
  withRegistrationId = false,
  withUsernameField = true,
  withPassword = false,
  loading = false,
  onCancel,
  onSubmit,
  labels = {
    title: "",
    submit: "Registrar",
  },
}) {
  const cancelButton = createTheme({
    palette: {
      primary: {
        main: "#C5C5C5",
      },
    },
  });

  const themeButton = createTheme({
    palette: {
      primary: {
        main: "#329F5B",
      },
    },
  });

  const styles = makeStyles({
    root: {
      "& .MuiFormControl-root": {
        display: "flex",
      },
      "& .MuiSelect-select.MuiSelect-select": {
        textAlign: "left",
      },
    },
  });

  const classesGrid = styles();

  const validate = (values) => {
    const REQUIRED_FIELDS_VALIDATION = [
      "nome",
      "pronoun",
      "email",
      "username",
      "universidade",
    ].filter((field) => withUsernameField || field !== "username");

    const FIELD_LENGHT_VALIDATION = {
      nome: 255,
      email: 64,
      username: 64,
      universidade: 64,
      registration_id: 9,
    };

    const errors = {};

    REQUIRED_FIELDS_VALIDATION.forEach((field) => {
      if (!values[field]) errors[field] = "Obrigatório";
    });

    Object.keys(FIELD_LENGHT_VALIDATION).forEach((key) => {
      if (values[key] && values[key].length > FIELD_LENGHT_VALIDATION[key])
        errors[
          key
        ] = `O tamanho máximo deste campo é de ${FIELD_LENGHT_VALIDATION[key]} caracteres.`;
    });

    if (withRegistrationId && !values.registration_id) {
      errors.registration_id = "Obrigatório";
    }

    if (withPassword && !values.password) errors.password = "Obrigatório";
    if (values.password && values.password.length > 16)
      errors.password = `O tamanho máximo deste campo é de 16 caracteres.`;

    if (values.email && !isEmailValid(values.email))
      errors.email = "Insira um e-mail válido";

    return errors;
  };

  return (
    <Container className="App">
      <div style={{ padding: 16, margin: "auto", maxWidth: 2000 }}>
        {labels.title && (
          <h2 style={{ display: "flex", alignItems: "center" }}>
            {labels.title}
          </h2>
        )}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReactLoading
              type={"spin"}
              color={"#41616c"}
              height={32}
              width={32}
            />
          </div>
        )}
        <div hidden={loading}>
          <Form
            onSubmit={onSubmit}
            initialValues={{
              nome: "",
              email: "",
              username: "",
              password: "",
              academic_title: "",
              universidade: "",
              pronoun: "",
              registration_id: "",
            }}
            validate={validate}
            render={({ values, handleSubmit, submitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Grid
                  container
                  alignItems="flex-start"
                  spacing={2}
                  className={classesGrid.root}
                >
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      name="nome"
                      value={values.nome}
                      component={TextField}
                      type="text"
                      label="Nome completo"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      name="pronoun"
                      value={values.pronoun}
                      component={Select}
                      label="Gênero"
                    >
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
                      multiline
                      name="email"
                      value={values.email}
                      component={TextField}
                      type="text"
                      label="Email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      multiline
                      name="universidade"
                      value={values.universidade}
                      component={TextField}
                      type="text"
                      label="Universidade"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      multiline
                      name="academic_title"
                      value={values.academic_title}
                      component={TextField}
                      type="text"
                      label="Título acadêmico"
                      placeholder="Exemplo: Doutor, Mestre, Bacharel.."
                    />
                  </Grid>
                  {withRegistrationId && (
                    <Grid item xs={12}>
                      <Field
                        fullWidth
                        multiline
                        name="registration_id"
                        value={values.registration_id}
                        component={TextField}
                        type="text"
                        label="Matrícula"
                      />
                    </Grid>
                  )}
                  {withUsernameField && (
                    <Grid item xs={12}>
                      <Field
                        fullWidth
                        multiline
                        name="username"
                        value={values.username}
                        component={TextField}
                        type="text"
                        label="Username"
                      />
                    </Grid>
                  )}
                  {withPassword && (
                    <Grid item xs={12}>
                      <Field
                        fullWidth
                        name="password"
                        value={values.password}
                        component={TextField}
                        type="password"
                        label="Senha"
                      />
                    </Grid>
                  )}
                  <Grid
                    item
                    xs={12}
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "end",
                      gap: "8px",
                    }}
                  >
                    <ThemeProvider theme={cancelButton}>
                      <Button
                        variant="contained"
                        color="primary"
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    </ThemeProvider>
                    <ThemeProvider theme={themeButton}>
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={submitting}
                      >
                        {labels.submit}
                      </Button>
                    </ThemeProvider>
                  </Grid>
                </Grid>
              </form>
            )}
          />
        </div>
      </div>
    </Container>
  );
}

export default UserForm;
