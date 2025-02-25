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
  FormControlLabel,
  Checkbox,
  Box,
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
import { isTeacher } from "Helpers/role";
import { useBanca } from "Hooks/Banca/useBanca";
import { useParams } from "react-router-dom/cjs/react-router-dom";

/*
  Componente responsável pela página de visualização de bancas
*/
function ViewBoard() {
  const [tipo_banca, setTipo_banca] = useState(true);
  const [done, setDone] = useState(undefined);
  const [cursos, setCursos] = useState([]);
  const [nota, setNota] = useState([]);

  const history = useHistory();
  const { id } = useParams();
  const { banca, loading } = useBanca(id);

  useEffect(() => {
    api.get("cursos").then(({ data: { data } }) => setCursos(data));
  }, []);

  const goToDashboard = () => {
    let path = `/dashboard`;
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

  function encode(details) {
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    return formBody;
  }

  const onSubmit = async (values) => {
    var hour = new Date(values.hora);
    var date = new Date(values.data_realizacao);

    hour.setHours(hour.getHours() - 3);
    hour.setDate(date.getDate());
    hour.setMonth(date.getMonth());
    hour.setFullYear(date.getFullYear());
    values.data_realizacao = hour.toISOString().slice(0, 19).replace("T", " ");
    values.visible = values.visible ? 1 : 0;

    api
      .put(`/banca/${banca.id}`, encode(values), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then(function (response) {
        goToDashboard();
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

  const handleChange = (e) => {
    const { value } = e.target;
    if (value === "remoto") {
      setTipo_banca(false);
    } else if (value === "local") {
      setTipo_banca(true);
    }
  };

  const generateReport = async () => {
    api.get(`/documento/documentoInfo/${banca.id}`).then(function (response) {
      var data = response.data;

      var bodyFormData = new FormData();
      bodyFormData.append("curso", data.curso);
      bodyFormData.append("disciplina", data.disciplina);
      bodyFormData.append("turma", data.turma);
      bodyFormData.append("titulo_trabalho", data.titulo_trabalho);
      bodyFormData.append("nome_curso", data.nome_curso);
      bodyFormData.append("data", data.data);
      bodyFormData.append("horario", data.horario);
      bodyFormData.append("nota_orientador", data.nota_orientador);
      bodyFormData.append("orientador", data.orientador);
      bodyFormData.append("semestre", data.semestre);
      bodyFormData.append("avaliadores", JSON.stringify(data.avaliadores));
      bodyFormData.append("aluno", data.aluno);
      api
        .post(`/documento/${banca.id}`, bodyFormData, {
          responseType: "blob",
        })
        .then((response) => {
          // RETRIEVE THE response AND CREATE LOCAL URL
          setDone(true);
          var _url = window.URL.createObjectURL(response.data);
          window.open(_url, "_blank").focus(); // window.open + focus
        })
        .catch((err) => {
          // console.log(err);
        });
    });
  };

  const generateOrientationReport = () => {
    api
      .get(`/documento/orientacao/${banca.id}`, {
        responseType: "blob",
      })
      .then((response) => {
        // RETRIEVE THE response AND CREATE LOCAL URL
        setDone(true);
        var _url = window.URL.createObjectURL(response.data);
        window.open(_url, "_blank").focus(); // window.open + focus
      })
      .catch((err) => {
        // console.log(err);
      });
  };

  const generateParticipationReport = () => {
    api
      .get(`/documento/participacao/${banca.id}`, {
        responseType: "blob",
      })
      .then((response) => {
        // RETRIEVE THE response AND CREATE LOCAL URL
        setDone(true);
        var _url = window.URL.createObjectURL(response.data);
        window.open(_url, "_blank").focus(); // window.open + focus
      })
      .catch((err) => {
        // console.log(err);
      });
  };

  useEffect(() => {
    if (banca?.id) {
      api.get(`/nota/${banca.id}`).then(function (response) {
        setNota(response.data.data || "");
        setDone(true);
        return response;
      });
    }
  }, [banca?.id]);

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
    },
  });

  const theme = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#1D2987",
        dark: "#0e1443",
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

  const classesGrid = styles();

  return (
    <>
      {loading || !done ? (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={100}
            width={100}
          />
        </div>
      ) : (
        <Container className="App banca-form-container">
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              maxWidth: 2000,
            }}
          >
            <CssBaseline />
            <h2 className="banca-form-header">Editar banca</h2>
            <Form
              onSubmit={onSubmit}
              initialValues={{
                titulo_trabalho: banca.titulo_trabalho,
                resumo: banca.resumo,
                abstract: banca.abstract,
                palavras_chave: banca.palavras_chave,
                local: banca.local,
                data_realizacao: banca.data_realizacao,
                hora: banca.data_realizacao,
                nota: nota,
                nota_nao_alteravel: nota,
                curso: banca.curso,
                autor: banca.autor,
                pronome_autor: banca.pronome_autor,
                turma: banca.turma,
                disciplina: banca.disciplina,
                tipo_banca: banca.tipo_banca,
                matricula: banca.matricula,
                ano: banca.ano,
                semestre_letivo: banca.semestre_letivo,
                visible: banca.visible && banca.visible !== "0",
              }}
              validate={validate}
              render={({
                handleSubmit,
                reset,
                submitting,
                pristine,
                values,
              }) => (
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
                        label="Titulo"
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
                    <Grid item xs={3}>
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
                      style={{
                        padding: 0,
                        marginTop: "auto",
                        fontSize: "13px",
                      }}
                      item
                      xs={3}
                    >
                      Remoto
                      <Field
                        name="tipo_banca"
                        component={Radio}
                        type="radio"
                        value="remoto"
                        onClick={handleChange}
                        checked={!tipo_banca}
                      ></Field>
                      Presencial
                      <Field
                        name="tipo_banca"
                        component={Radio}
                        type="radio"
                        value="local"
                        onClick={handleChange}
                        checked={tipo_banca}
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
                        component={TextField}
                        Obrigatório
                        label="Local ou link"
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
                      <Grid item xs={12}>
                        <Field
                          name="nota_nao_alteravel"
                          disabled
                          fullWidth
                          component={TextField}
                          label="Nota Final"
                        />
                      </Grid>
                    </MuiPickersUtilsProvider>
                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      width="100%"
                      gridGap={8}
                    >
                      <ThemeProvider theme={theme}>
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
                      <ThemeProvider theme={theme}>
                        {isTeacher() && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                setDone(false);
                                generateReport();
                              }}
                              style={{ marginLeft: 10, borderRadius: 10 }}
                            >
                              Gerar relatório
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                setDone(false);
                                generateOrientationReport();
                              }}
                              style={{ marginLeft: 10, borderRadius: 10 }}
                            >
                              Gerar Declaração de Orientação
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                setDone(false);
                                generateParticipationReport();
                              }}
                              style={{ marginLeft: 10, borderRadius: 10 }}
                            >
                              Gerar Declaração de Participação
                            </Button>
                          </>
                        )}
                      </ThemeProvider>
                      <ThemeProvider theme={themeEditar}>
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          disabled={submitting}
                          style={{ borderRadius: 10 }}
                        >
                          Editar
                        </Button>
                      </ThemeProvider>
                    </Box>
                  </Grid>
                </form>
              )}
            />
          </div>
        </Container>
      )}
    </>
  );
}
export default ViewBoard;
