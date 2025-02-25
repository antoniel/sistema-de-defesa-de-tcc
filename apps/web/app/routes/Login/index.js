import React from "react";

import ReactLoading from "react-loading";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  styled,
} from "@material-ui/core";
import { Link } from "react-router-dom/cjs/react-router-dom";
import { Field, Form } from "react-final-form";

import { useAuth } from "Hooks/Authentication/useAuth";
import { useQuery } from "Hooks/Helpers/useQuery";

const SignInButton = styled(Button)({
  backgroundColor: "#6c7ae0",
  color: "white",
  margin: 0,
  "&:hover": {
    backgroundColor: "#002884",
  },
});

const ForgotPasswordLink = styled(Typography)({
  textDecoration: "none",
  textAlign: "center",
  color: "#000000de",
  display: "block",
});

function Login() {
  const { loading, signIn } = useAuth();
  const query = useQuery();

  const validadeRequiredFields = (value) =>
    value ? undefined : "Campo Obrigatório";

  return (
    <>
      {loading && (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={80}
            width={80}
          />
        </div>
      )}
      <Container maxWidth="sm">
        <Box height={20} />
        <Paper>
          <Typography align="center" variant="h5">
            Login
          </Typography>
          <Box margin={2}>
            <Form onSubmit={(values) => signIn(values, query.get("ref"))}>
              {({ handleSubmit }) => (
                <form onSubmit={handleSubmit}>
                  <Field name="username" validate={validadeRequiredFields}>
                    {({ input, meta }) => (
                      <TextField
                        label="Nome de usuário ou E-mail"
                        variant="outlined"
                        margin="normal"
                        name={input.name}
                        value={input.value}
                        onChange={input.onChange}
                        helperText={
                          Boolean(meta.error && meta.touched) && meta.error
                        }
                        error={Boolean(meta.error && meta.touched)}
                      />
                    )}
                  </Field>
                  <Field name="password" validate={validadeRequiredFields}>
                    {({ input, meta }) => (
                      <TextField
                        label="Senha"
                        variant="outlined"
                        margin="normal"
                        type="password"
                        name={input.name}
                        value={input.value}
                        onChange={input.onChange}
                        helperText={
                          Boolean(meta.error && meta.touched) && meta.error
                        }
                        error={Boolean(meta.error && meta.touched)}
                      />
                    )}
                  </Field>
                  <SignInButton
                    classes={{ root: "sign-in-button" }}
                    className="sign-in-button"
                    variant="contained"
                    type="submit"
                    fullWidth
                  >
                    Entrar
                  </SignInButton>
                </form>
              )}
            </Form>
            <Box height={16} />
            <ForgotPasswordLink component={Link} to="resetpass">
              Esqueceu a senha?
            </ForgotPasswordLink>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default Login;
