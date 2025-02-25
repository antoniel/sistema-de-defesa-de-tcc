import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import "./styles.css";
import ReactLoading from "react-loading";
import { Button, ThemeProvider } from "@material-ui/core";
import SelectSearch, { fuzzySearch } from "react-select-search";
import { createTheme } from "@material-ui/core/styles";
import api from "Config/http";
import { toast } from "react-toastify";

/*
  Componente responsável pela página de adição de usuários à bancas
*/

function Users() {
  const [data, setData] = useState([]);
  const [userIds] = useState([]);
  const [done, setDone] = useState(undefined);
  const [optionsUsers, setOptionsUsers] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [cargo, setCargo] = useState("");

  const history = useHistory();

  const goToDashboard = () => {
    let path = ``;
    history.push(path);
  };

  const reload = () => {
    window.location.reload();
  };

  const userId = localStorage.getItem("userId");

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

  const themeConvite = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#1D2987",
        dark: "#0e1443",
        contrastText: "#fff",
      },
    },
  });

  const editRole = async () => {
    var bodyFormData = new FormData();
    bodyFormData.append("role", cargo);
    setDone(false);
    api
      .post(`/usuario/${usuario}/role`, bodyFormData)
      .then(function (response) {
        setDone(true);
        reload();
      });
  };

  const generateLink = () => {
    var bodyFormData = new FormData();
    bodyFormData.append("user_id", userId);
    bodyFormData.append("invite_hash", Math.random());

    api.post("/invite", bodyFormData).then(function (response) {
      const baseUrl = window.location.hostname;

      const inviteLink = `${baseUrl}/register?inv=${response.data.data}`;
      navigator.clipboard.writeText(inviteLink);
      toast.success(
        `O link de convite: ${inviteLink} foi copiado para a área de transferência.`
      );
    });
  };

  useEffect(() => {
    api.get("/usuario").then(function (response) {
      setData(response.data.data);
      setDone(true);
      return response;
    });
  }, []);

  const userChange = (value) => {
    setUsuario(value);
  };

  const roleChange = (value) => {
    setCargo(value);
  };

  if (data && data.length > 0 && optionsUsers.length <= 0) {
    const options = data
      .filter(function (e) {
        return !userIds.includes(e.id);
      })
      .map((user) => ({ name: user.nome, value: user.id }));
    setOptionsUsers(options);
  }

  const optionsCargos = [
    {
      name: "Orientador",
      value: 1,
    },
    {
      name: "Co-Orientador",
      value: 2,
    },
    {
      name: "Administrador",
      value: 3,
    },
  ];

  return (
    <>
      {!done ? (
        <div className="center">
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={100}
            width={100}
          />
        </div>
      ) : (
        <div className="container">
          <div>
            <div className="right-btn">
              <ThemeProvider theme={themeConvite}>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={generateLink}
                  style={{ borderRadius: 10 }}
                >
                  Gerar link de convite
                </Button>
              </ThemeProvider>
            </div>
            <h2>Usuários</h2>
          </div>
          <div>
            <div className="user">
              <div className="user-name">
                <SelectSearch
                  id="user-select"
                  filterOptions={fuzzySearch}
                  options={optionsUsers}
                  search
                  value={usuario}
                  onChange={userChange}
                  placeholder="Usuário"
                />
              </div>
              <div className="user-right" style={{ display: "flex" }}>
                <SelectSearch
                  id="role-select"
                  filterOptions={fuzzySearch}
                  options={optionsCargos}
                  search
                  value={cargo}
                  onChange={roleChange}
                  placeholder="Função"
                />
                <ThemeProvider theme={theme}>
                  <Button
                    onClick={editRole}
                    className="user-role"
                    type="button"
                    variant="contained"
                    color="primary"
                    style={{ marginLeft: 16, borderRadius: 10 }}
                  >
                    Alterar função
                  </Button>
                </ThemeProvider>
              </div>
            </div>
            <ThemeProvider theme={theme}>
              <Button
                variant="contained"
                color="secondary"
                type="button"
                onClick={goToDashboard}
                style={{ borderRadius: 10 }}
              >
                Voltar
              </Button>
            </ThemeProvider>
          </div>
        </div>
      )}
    </>
  );
}

export default Users;
