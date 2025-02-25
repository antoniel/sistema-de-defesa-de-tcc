import React, { useContext, useState, useCallback, useMemo } from "react";
import { MyContext } from "../../Context";
import { useHistory } from "react-router-dom";
import "./styles.css";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { Form, Field } from "react-final-form";
import { TextField, Select } from "final-form-material-ui";
import { Grid, Button, CssBaseline, MenuItem } from "@material-ui/core";
import { useQuery } from "Hooks/Helpers/useQuery";
import { toast } from "react-toastify";

import ReactLoading from "react-loading";

import * as Yup from "yup";

const yupSync = (schema) => async (values) => {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    return error.inner.reduce((errors, err) => {
      errors[err.path] = err.message;
      return errors;
    }, {});
  }
};

// validação Yup
const validationSchemaForTeachers = Yup.object().shape({
  nome: Yup.string()
    .max(255, "Máximo de 255 caracteres")
    .required("Campo Obrigatório"),
  email: Yup.string()
    .email("Insira um e-mail válido")
    .max(64, "Máximo de 64 caracteres")
    .required("Campo Obrigatório"),
  username: Yup.string()
    .max(255, "Máximo de 255 caracteres")
    .required("Campo Obrigatório"),
  password: Yup.string()
    .min(6, "Mínimo de 6 caracteres")
    .max(16, "Máximo de 16 caracteres")
    .required("Campo Obrigatório"),
  universidade: Yup.string()
    .max(64, "Máximo de 64 caracteres")
    .required("Campo Obrigatório"),
  pronoun: Yup.string().required("Campo Obrigatório"),
  academic_title: Yup.string().required("Campo Obrigatório"),
  registration_id: Yup.string().max(9, "Máximo de 9 caracteres"),
});

const validationSchema = Yup.object().shape({
  nome: Yup.string()
    .max(255, "Máximo de 255 caracteres")
    .required("Campo Obrigatório"),
  email: Yup.string()
    .email("Insira um e-mail válido")
    .max(64, "Máximo de 64 caracteres")
    .required("Campo Obrigatório"),
  username: Yup.string()
    .max(255, "Máximo de 255 caracteres")
    .required("Campo Obrigatório"),
  password: Yup.string()
    .min(6, "Mínimo de 6 caracteres")
    .max(16, "Máximo de 16 caracteres")
    .required("Campo Obrigatório"),
  universidade: Yup.string()
    .max(64, "Máximo de 64 caracteres")
    .required("Campo Obrigatório"),
  pronoun: Yup.string().required("Campo Obrigatório"),
  academic_title: Yup.string().required("Campo Obrigatório"),
  registration_id: Yup.string()
    .required("Campo Obrigatório")
    .max(9, "Máximo de 9 caracteres"),
});

function Register() {
  const { registerUser } = useContext(MyContext);
  const [loading, setLoading] = useState(false);
  const query = useQuery();
  const history = useHistory();

  const validate = useMemo(
    () =>
      yupSync(
        query.get("inv") ? validationSchemaForTeachers : validationSchema
      ),
    [query]
  );

  const [state, setState] = useState({
    errorMsg: "",
    successMsg: "",
  });

  const goToHome = useCallback(() => {
    history.push("");
  }, [history]);

  const checkUserExist = async (email) => {
    try {
      const response = await fetch(`/api/checkUser?email=${email}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.error(`Erro na resposta da API: ${response.status}`);
        return false;
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return false;
    }
  };

  // Função para submeter o formulário
  const submitForm = async (values) => {
    values.hash = query.get("inv");
    try {
      setLoading(true);
      const userExists = await checkUserExist(values.email);
      if (userExists) {
        setState({ errorMsg: "Usuário já existe", successMsg: "" });
        toast.error("Usuário já existe!");
        setLoading(false);
        return;
      }
      await registerUser(values);
      setState({ errorMsg: "", successMsg: "Usuário cadastrado com sucesso" });
      toast.success("Usuário cadastrado com sucesso!");
      goToHome();
      setLoading(false);
    } catch (error) {
      setState({ errorMsg: "Erro ao cadastrar usuário", successMsg: "" });
      toast.error(
        "Não foi possível cadastrar o usuário. Tente novamente mais tarde."
      );
      console.error("Erro:", error);
      setLoading(false);
    }
  };

  // Estilos do botão
  const themeButton = createTheme({
    palette: { primary: { main: "#329F5B" } },
  });

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
      "& .MuiFormControl-root": { display: "flex" },
      "& .MuiSelect-select.MuiSelect-select": { textAlign: "left" },
    },
  });
  const classesGrid = styles();

  return (
    <Container className="App">
      {loading ? (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={100}
            width={100}
          />
        </div>
      ) : (
        <div style={{ padding: 16, margin: "auto", maxWidth: 2000 }}>
          <CssBaseline />
          <Form
            onSubmit={submitForm}
            initialValues={{
              nome: "",
              email: "",
              username: "",
              password: "",
              universidade: "",
              academic_title: "",
              pronoun: "",
              registration_id: "",
            }}
            validate={validate}
            render={({ handleSubmit }) => (
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
                      Obrigatório
                      name="nome"
                      value={state.nome}
                      component={TextField}
                      type="text"
                      label="Nome completo"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      name="pronoun"
                      value={state.pronoun}
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
                      Obrigatório
                      multiline
                      name="email"
                      value={state.email}
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
                      value={state.universidade}
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
                      value={state.academic_title}
                      component={TextField}
                      type="text"
                      label="Título acadêmico"
                      placeholder="Exemplo: Doutor, Mestre, Bacharel.."
                    />
                  </Grid>
                  {!query.get("inv") && (
                    <Grid item xs={12}>
                      <Field
                        fullWidth
                        multiline
                        name="registration_id"
                        value={state.registration_id}
                        component={TextField}
                        type="text"
                        label="Matrícula"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      Obrigatório
                      multiline
                      name="username"
                      value={state.username}
                      component={TextField}
                      type="text"
                      label="Username"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      Obrigatório
                      name="password"
                      value={state.password}
                      component={TextField}
                      type="password"
                      label="Senha"
                    />
                  </Grid>
                  <Grid item style={{ marginTop: 16 }}>
                    <ThemeProvider theme={themeButton}>
                      <Button variant="contained" color="primary" type="submit">
                        Registrar
                      </Button>
                    </ThemeProvider>
                  </Grid>
                </Grid>
              </form>
            )}
          />
        </div>
      )}
    </Container>
  );
}

export default Register;
