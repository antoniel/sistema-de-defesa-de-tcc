import React, { useEffect, useState } from "react";
import "./styles.css";
import Container from "@material-ui/core/Container";
import ReactLoading from "react-loading";
import { useHistory } from "react-router-dom";
import { Form, Field } from "react-final-form";
import { TextField, Radio, Select } from "final-form-material-ui";
import {
  Grid,
  Button,
  CssBaseline,
  MenuItem,
  ThemeProvider,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
// Picker
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  TimePicker,
  DatePicker,
} from "@material-ui/pickers";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme } from "@material-ui/core/styles";
import api from "Config/http";
import useTeachers from "Hooks/Users/useTeachers";
import { isTeacher } from "Helpers/role";
import { toast } from "react-toastify";

/*
  Componente responsável pela página de criação de bancas
*/

function ExaminingBoard() {
  const { loading: loadingTeachers, users: teachers } = useTeachers();
  const [tipo_banca, setTipo_banca] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState([]);
  const history = useHistory();

  useEffect(() => {
    api.get("cursos").then(({ data: { data } }) => setCursos(data));
  }, []);

  const goToDashboard = () => {
    let path = `dashboard`;
    history.push(path);
  };

  function DatePickerWrapper(props) {
    const {
      input: { name, onChange, value, ...restInput },
      meta,
      ...rest
    } = props;
    const showError =
      ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
      meta.touched;

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
    );
  }

  function TimePickerWrapper(props) {
    const {
      input: { name, onChange, value, ...restInput },
      meta,
      ...rest
    } = props;
    const showError =
      ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
      meta.touched;

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
    );
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
  });

  const handleChange = (e) => {
    const { value } = e.target;
    if (value === "remoto") {
      setTipo_banca(false);
    } else if (value === "local") {
      setTipo_banca(true);
    }
  };

  const onSubmit = async (values) => {
    const hour = new Date(values.hora);
    const date = new Date(values.data_realizacao);
    const userId = localStorage.getItem("userId");
    values.user_id = userId;

    hour.setHours(hour.getHours() - 3);
    hour.setDate(date.getDate());
    hour.setMonth(date.getMonth());
    hour.setFullYear(date.getFullYear());
    values.data_realizacao = hour.toISOString().slice(0, 19).replace("T", " ");
    values.visible = values.visible ? 1 : 0;
    setLoading(true);

    api
      .post("/banca", values)
      .then(function () {
        setLoading(false);
        goToDashboard();
      })
      .catch(() => {
        setLoading(false);
        toast.error("Ocorreu um erro ao tentar cadastrar a banca");
      });
  };

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
    ];

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
    };

    const errors = {};

    REQUIRED_FIELDS_VALIDATION.forEach((key) => {
      if (!values[key]) errors[key] = "Obrigatório";
    });

    Object.keys(FIELD_LENGHT_VALIDATION).forEach((key) => {
      if (values[key] && values[key].length > FIELD_LENGHT_VALIDATION[key])
        errors[
          key
        ] = `O tamanho máximo deste campo é de ${FIELD_LENGHT_VALIDATION[key]} caracteres.`;
    });

    if (isTeacher() && !values.autor) {
      errors.autor = "Obrigatório";
    }
    if (isTeacher() && values.pronome_autor !== 0 && !values.pronome_autor) {
      errors.pronome_autor = "Obrigatório";
    }
    if (isTeacher() && !values.matricula) {
      errors.matricula = "Obrigatório";
    }

    if (values.ano && !Number(values.ano))
      errors.ano = "Insira um valor válido";

    return errors;
  };

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
    },
  });

  const classesGrid = styles();

  return (
    <Container className="App banca-form-container">
      {loading ? (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={50}
            width={50}
          />
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
              <Grid
                container
                alignItems="flex-start"
                spacing={2}
                className={classesGrid.root}
              >
                <Grid item xs={isTeacher() ? 10 : 12}>
                  <Field
                    fullWidth
                    Obrigatório
                    multiline
                    name="titulo_trabalho"
                    component={TextField}
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
                          control={
                            <Checkbox
                              checked={input.value}
                              onChange={input.onChange}
                            />
                          }
                          label={`Visibilidade: ${
                            input.value ? "Pública" : "Privada"
                          }`}
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
                    component={TextField}
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
                    component={TextField}
                    label="Abstract"
                  />
                </Grid>
                {isTeacher() ? (
                  <>
                    <Grid item xs={6}>
                      <Field
                        name="autor"
                        fullWidth
                        Obrigatório
                        component={TextField}
                        label="Autor"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Field
                        name="matricula"
                        fullWidth
                        Obrigatório
                        component={TextField}
                        label="Matrícula"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Field
                        component={Select}
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
                      component={Select}
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
                    component={TextField}
                    label="Palavras Chave (Separadas por vírgula)"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    name="turma"
                    fullWidth
                    Obrigatório
                    component={TextField}
                    label="Turma"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Field
                    name="curso"
                    label="Curso"
                    formControlProps={{ className: "curso" }}
                    component={Select}
                  >
                    {cursos.map(({ id, sigla }) => (
                      <MenuItem key={id} value={id}>
                        {sigla}
                      </MenuItem>
                    ))}
                  </Field>
                </Grid>
                <Grid
                  style={{ padding: 0, marginTop: "auto", fontSize: "13px" }}
                  item
                  xs={2}
                >
                  Remoto
                  <Field
                    name="tipo_banca"
                    component={Radio}
                    type="radio"
                    value="remoto"
                    onClick={handleChange}
                  ></Field>
                  Presencial
                  <Field
                    name="tipo_banca"
                    component={Radio}
                    type="radio"
                    value="local"
                    onClick={handleChange}
                  ></Field>
                </Grid>
                <Grid item xs={3}>
                  <Field
                    name="ano"
                    multiline
                    fullWidth
                    Obrigatório
                    component={TextField}
                    label="Ano"
                  />
                </Grid>
                <Grid item xs={3}>
                  <Field
                    component={Select}
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
                    component={TextField}
                    label={tipo_banca ? "Local" : "Link"}
                  />
                </Grid>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
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
                </MuiPickersUtilsProvider>
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
  );
}
export default ExaminingBoard;
