import React, { useCallback, useEffect, useState } from "react";
import "./styles.css";
import Container from "@material-ui/core/Container";
import ReactLoading from "react-loading";
import { useHistory, useLocation } from "react-router-dom";

import CardBanca from "../../Components/Card";
import { Grid, Button, CssBaseline, ThemeProvider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme } from "@material-ui/core/styles";
import api from "Config/http";

/*
  Componente responsável pela página de visualização de bancas
*/

function ViewBanca() {
  const location = useLocation();
  const history = useHistory();

  const [banca, setBanca] = useState([]);
  const [inn, setInn] = useState([]);
  const [done, setDone] = useState(false);
  const [done2, setDone2] = useState(false);
  const [date, setDate] = useState("");

  const goToHome = useCallback(() => {
    if (location.key) history.goBack();
    else history.push("");
  }, [history, location]);

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

  useEffect(() => {
    let url = window.location.href;
    let regex = /[?&]([^=#]+)=([^&#]*)/g,
      banca = "",
      match;
    match = regex.exec(url);
    if (match == null) {
      goToHome();
    }
    banca = match[2];
    api.get(`/banca/${banca}`).then(function (response) {
      if (response.data.data != null) {
        let data = new Date(response.data.data.data_realizacao);
        data.setSeconds(0);
        setDate(
          data.toLocaleString("pt-BR", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setBanca(response.data.data);
        setDone(true);
      } else {
        goToHome();
      }
    });
  }, [goToHome]);

  useEffect(() => {
    let url = window.location.href;
    let regex = /[?&]([^=#]+)=([^&#]*)/g,
      banca = "",
      match;
    match = regex.exec(url);
    if (match == null) {
      goToHome();
    }
    banca = match[2];
    api
      .get(`/usuario-banca/usuarios/${banca}`)
      .then(function (response) {
        setInn(response.data.data);
        setDone2(true);
      })
      .catch(function (error) {
        setDone2(true);
      });
  }, [goToHome]);

  const styles = makeStyles({
    root: {
      boxShadow: "0 0 4px rgb(0 0 0 / 12%), 0 2px 4px rgb(0 0 0 / 20%)",
      padding: "16px",
      borderRadius: "8px",
    },
  });

  const classesGrid = styles();

  return (
    <>
      {!done && !done2 ? (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={100}
            width={100}
          />
        </div>
      ) : (
        <Container className="App">
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              margin: "auto",
              maxWidth: 2000,
            }}
          >
            <CssBaseline />
            <Grid
              container
              alignItems="flex-start"
              spacing={2}
              className={classesGrid.root}
            >
              <div className="banca-content">
                <h1>Título: {banca.titulo_trabalho}</h1>
              </div>
              <Grid container justifyContent="flex-start" spacing={2}>
                <Grid item xs={12}>
                  <CardBanca text={banca.resumo} title="Resumo"></CardBanca>
                </Grid>
                <Grid item xs={12}>
                  <CardBanca text={banca.abstract} title="Abstract"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={banca.autor} title="Autor"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca
                    text={banca.matricula}
                    title="Matrícula"
                  ></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca
                    text={banca.palavras_chave}
                    title="Palavras Chaves (Separadas por vírgula)"
                  ></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={banca.turma} title="Turma"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={banca.nome_curso} title="Curso"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={banca.ano} title="Ano"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca
                    text={banca.semestre_letivo}
                    title="Semestre Letivo"
                  ></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={banca.local} title="Local"></CardBanca>
                </Grid>
                <Grid item xs={4}>
                  <CardBanca text={date} title="Data e hora"></CardBanca>
                </Grid>
                <Grid item xs={12}>
                  <CardBanca text={inn} title="Banca avaliadora"></CardBanca>
                  {/* {inn && inn.length > 0 ? (
                    inn.map((user) => (
                      <div className="banca-content">
                        <span>{user.nome}</span>
                      </div>
                    ))
                  ) : (
                    <div className="banca-content"><strong>Pendente</strong></div>
                  )} */}
                </Grid>
                <ThemeProvider theme={theme}>
                  <Button
                    variant="contained"
                    color="secondary"
                    type="button"
                    onClick={goToHome}
                    style={{ marginLeft: 8, borderRadius: 10 }}
                  >
                    Voltar
                  </Button>
                </ThemeProvider>
              </Grid>
            </Grid>
          </div>
          <div></div>
        </Container>
      )}
    </>
  );
}
export default ViewBanca;
