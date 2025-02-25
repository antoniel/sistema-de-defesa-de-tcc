import {
  Button,
  Grid,
  ThemeProvider,
  Typography,
  createTheme,
} from "@material-ui/core";
import { Field, Form } from "react-final-form";
import React from "react";

import { TextField } from "final-form-material-ui";

const themeEditar = createTheme({
  palette: {
    primary: {
      light: "#757ce8",
      main: "#329F5B",
      dark: "#184e2d",
      contrastText: "#fff",
    },
  },
});

export default function CourseForm({ course, onSubmit }) {
  const validate = (values) => {
    const errors = {};
    const REQUIRED_FIELDS_VALIDATION = [
      "nome",
      "sigla",
      "disciplina",
      "coordenacao",
      "cargo_coordenacao",
    ];

    const FIELD_LENGHT_VALIDATION = {
      nome: 30,
      sigla: 10,
      disciplina: 10,
      coordenacao: 50,
      cargo_coordenacao: 100,
    };

    REQUIRED_FIELDS_VALIDATION.forEach((field) => {
      if (!values[field]) errors[field] = "Obrigatório";
    });

    Object.keys(FIELD_LENGHT_VALIDATION).forEach((key) => {
      if (values[key] && values[key].length > FIELD_LENGHT_VALIDATION[key])
        errors[
          key
        ] = `O tamanho máximo deste campo é de ${FIELD_LENGHT_VALIDATION[key]} caracteres.`;
    });

    return errors;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "32px" }}>
      <Typography variant="h6" gutterBottom>
        {course?.id ? `Editar Curso - ${course.nome}` : "Adicionar Curso"}
      </Typography>
      <Form
        onSubmit={onSubmit}
        initialValues={{
          id: "",
          nome: "",
          sigla: "",
          disciplina: "",
          coordenacao: "",
          cargo_coordenacao: "",
          ...course,
        }}
        validate={validate}
        render={({ submitting, values, handleSubmit }) => (
          <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={9}>
                <Field
                  component={TextField}
                  label="Nome do Curso"
                  name="nome"
                  type="text"
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <Field
                  component={TextField}
                  label="Sigla"
                  name="sigla"
                  type="text"
                  fullWidth
                  value={values.sigla}
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  label="Disciplina Final"
                  name="disciplina"
                  type="text"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  label="Coordenador(a)"
                  name="coordenacao"
                  type="text"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  label="Título do(a) coordenador(a)"
                  name="cargo_coordenacao"
                  type="text"
                  fullWidth
                  multiple
                />
              </Grid>
              <Grid item xs={9} />
              <Grid item xs={3}>
                <ThemeProvider theme={themeEditar}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    style={{ borderRadius: 10 }}
                    disabled={submitting}
                    fullWidth
                  >
                    Salvar Curso
                  </Button>
                </ThemeProvider>
              </Grid>
            </Grid>
          </form>
        )}
      />
    </div>
  );
}
