import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { Box, Button } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

import InsitutoDeComputacao from "../../../Assets/Images/instituto_de_computacao.png";
import { MyContext } from "../../../Context";
import "./styles.css";
import UserActions from "./UserActions";
/*
  Componente responsável pela renderização do cabeçalho da aplicação
*/

const Header = () => {
  const { logoutUser, isLoggedIn } = useContext(MyContext);
  const [isUserLogged, setIsUserLogged] = useState(isLoggedIn());

  const history = useHistory();

  const theme = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#6c7ae0",
        dark: "#002884",
        contrastText: "#fff",
      },
      secondary: {
        light: "#ff7961",
        main: "#f44336",
        dark: "#ba000d",
        contrastText: "#000",
      },
      third: {
        light: "#ff7961",
        main: "#00ff00",
        dark: "#ba000d",
        contrastText: "#000",
      },
    },
  });

  const evaluationTheme = createTheme({
    palette: {
      primary: {
        light: "#329f5b",
        main: "#329f5b",
        dark: "#329f5b",
        contrastText: "#fff",
      },
    },
  });

  const redirectTo = (path) => {
    history.push(path);
  };

  const onClickLogout = () => {
    logoutUser();
    setIsUserLogged(false);
    redirectTo("/");
  };

  const onClickEvaluate = () => {
    window.open(
      "https://docs.google.com/forms/d/1_kGlkMi9KywxwHiVuBCyJt-vfgcb93MwXQUuNAEUL6U",
      "_blank"
    );
  };

  return (
    <>
      <div className="header" expand="lg">
        <div className="logo-container">
          <Link className="link" to="/" style={{ textDecoration: "none" }}>
            <img
              src={InsitutoDeComputacao}
              alt="Logos IC"
              className="img-logo"
            />
            <h1 className="logo">Sistema de Defesas de TCC</h1>
          </Link>
        </div>
        {isUserLogged ? (
          <div className="authenticated-navigation">
            <ThemeProvider theme={theme}>
              <ThemeProvider theme={evaluationTheme}>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginRight: 16 }}
                  onClick={() => onClickEvaluate()}
                >
                  Avaliação do Sistema
                </Button>
              </ThemeProvider>
              <Button className="navigation-option" component={Link} to="/">
                Home
              </Button>
              <Button
                className="navigation-option"
                component={Link}
                to="/dashboard"
              >
                Minhas Bancas
              </Button>
              {localStorage.getItem("role") === "3" && (
                <Button
                  className="navigation-option"
                  component={Link}
                  to="/settings"
                >
                  Painel Administrativo
                </Button>
              )}
              <UserActions
                name={localStorage.getItem("nome")}
                role={localStorage.getItem("role")}
                onClickLogout={onClickLogout}
                isLoggedIn
              />
            </ThemeProvider>
          </div>
        ) : (
          <div className="sign-in-buttons">
            <ThemeProvider theme={theme}>
              <ThemeProvider theme={evaluationTheme}>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginRight: 16 }}
                  onClick={() => onClickEvaluate()}
                >
                  Avaliação do Sistema
                </Button>
              </ThemeProvider>
              <Link
                variant="contained"
                color="primary"
                component={Button}
                to="login"
              >
                Login
              </Link>
              <Box width={8} />
              <Link
                variant="text"
                color="primary"
                component={Button}
                to="register"
              >
                Registre-se
              </Link>
            </ThemeProvider>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
