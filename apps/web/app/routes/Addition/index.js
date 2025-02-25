import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ReactLoading from "react-loading";
import {
  Box,
  Button,
  Container,
  Modal,
  ThemeProvider,
} from "@material-ui/core";
import { DataGrid } from "@mui/x-data-grid";
import SelectSearch, { fuzzySearch } from "react-select-search";
import { createTheme } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/core/styles";
import api from "Config/http";
import "./styles.css";
import { MailOutline } from "@material-ui/icons";
import usePreRegister from "Hooks/Addition/usePreRegister";
import UserForm from "Components/User/UserForm";
import { isTeacher } from "Helpers/role";
import { ptBRGrid } from "Assets/Locales/grid.locale";
import { toast } from "react-toastify";
/*
  Componente responsável pela página de adição de usuários à bancas
*/

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  borderRadius: 4,
  padding: "4px",
};

function Addition() {
  const { open, loading, openModal, closeModal, onSubmit } = usePreRegister();

  const [data, setData] = useState([]);
  const [usuario, setUsuario] = useState({ name: "", value: 0 });
  const [cargo, setCargo] = useState("");
  const [inn, setInn] = useState([]);
  const [userIds, setUserIds] = useState([]);
  const [done, setDone] = useState(undefined);
  const [done2, setDone2] = useState(undefined);
  const [done3, setDone3] = useState(undefined);
  const [optionsUsers, setOptionsUsers] = useState([]);

  const history = useHistory();

  const reload = () => {
    window.location.reload();
  };

  const bancaId = localStorage.getItem("bancaId");

  const optionsCargos = [
    {
      name: "Orientador",
      value: "orientador",
    },
    {
      name: "Co-Orientador",
      value: "coorientador",
    },
    {
      name: "Avaliador",
      value: "avaliador",
    },
  ];

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

  const themeRemover = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#df2a39",
        dark: "#931621",
        contrastText: "#fff",
      },
    },
  });

  const theme2 = createTheme({
    palette: {
      primary: {
        light: "#757ce8",
        main: "#6c7ae0",
        dark: "#2B8C50",
        contrastText: "#fff",
      },
    },
  });

  const removeUser = (id) => {
    api
      .delete(`/banca/${bancaId}/user/${id}`)
      .then(function (response) {
        reload();
      })
      .catch(function (error) {
        toast.error(error.response.data.message);
      });
  };

  const addUser = () => {
    api
      .post(`/usuario-banca/${bancaId}`, {
        id_usuario: usuario.value,
        usuario_name: usuario.name,
        role: cargo,
      })
      .then(function (response) {
        reload();
      })
      .catch(function (error) {
        toast.error(error.response.data.message);
      });
  };

  useEffect(() => {
    api.get("/usuario").then(function (response) {
      setData(response.data.data);
      setDone(true);
    });
  }, []);

  useEffect(() => {
    api.get(`/banca/${bancaId}`).then(function (response) {
      setDone3(true);
      api.get(`/usuario-banca/usuarios/${bancaId}`).then(function (response2) {
        let aluno = { role: "Aluno", nome: response.data.data.autor, id: 0 };
        response2.data.data.push(aluno);
        setInn(response2.data.data);
        setDone2(true);
        let ids = [];
        for (var i = 0; i < response2.data.data.length; ++i) {
          ids.push(parseInt(response2.data.data[i].id));
        }
        setUserIds(ids);
      });
      return response;
    });
  }, [bancaId]);

  const renderDetailsButton = (params) => {
    return (
      <div>
        {params.id !== 0 ? (
          <ThemeProvider theme={themeRemover}>
            <Button
              onClick={() => removeUser(params.id)}
              className="user-role"
              type="button"
              variant="contained"
              color="primary"
              style={{ borderRadius: 10 }}
            >
              Remover da banca
            </Button>
          </ThemeProvider>
        ) : null}
      </div>
    );
  };

  const columnsNota = [
    { field: "role", headerName: "Função", width: 150 },
    { field: "nome", headerName: "Nome", flex: 1, minWidth: 200 },
    {
      field: "actions",
      headerName: "Ações",
      width: 200,
      renderCell: renderDetailsButton,
      disableClickEventBubbling: true,
      sortable: false,
    },
  ];

  const goToDashboard = () => {
    let path = `dashboard`;
    history.push(path);
    toast.success("Membros da banca atualizados com sucesso!");
  };

  const userChange = (value, obj) => {
    setUsuario(obj);
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

  let missing = "";
  if (inn.length < 4 && inn.length !== 1) {
    missing += "Falta(m): ";
    let orientador = 1;
    let avaliador = 2;
    for (let x = 0; x < inn.length; x++) {
      let user = inn[x];
      if (user.role === "orientador") {
        orientador--;
      } else if (user.role === "avaliador") {
        avaliador--;
      }
    }
    if (orientador === 1) {
      missing += "1 orientador, ";
    }
    if (avaliador === 1) {
      missing += "1 avaliador";
    } else if (avaliador === 2) {
      missing += "2 avaliadores";
    }
  }

  const styles = makeStyles({
    root: {
      borderRadius: "10px",
      "& .MuiDataGrid-columnsContainer": {
        background: "#6c7ae0",
        borderRadius: "10px 10px 0 0px",
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        color: "white",
        fontWeight: 700,
      },
      "& .MuiDataGrid-columnHeaderTitleContainer": {
        justifyContent: "center",
      },
    },
  });
  const classes = styles();

  return (
    <Container maxWidth="xl">
      {!done || !done2 || !done3 ? (
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
          <h2>Adicionar membro</h2>
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
              {isTeacher() && (
                <div className="user-name">
                  ou
                  <ThemeProvider theme={theme}>
                    <Button
                      onClick={openModal}
                      className="user-role"
                      type="button"
                      variant="contained"
                      color="primary"
                      style={{ marginLeft: 16, borderRadius: 10 }}
                    >
                      <MailOutline style={{ marginRight: "0.5rem" }} />
                      Pré-cadastrar componente
                    </Button>
                  </ThemeProvider>
                  <Modal open={open} onClose={closeModal}>
                    <Box sx={style}>
                      <UserForm
                        onSubmit={onSubmit}
                        onCancel={closeModal}
                        labels={{
                          submit: "Concluir pré-cadastro",
                          title: "Pré-cadastrar componente",
                        }}
                        loading={loading}
                        withUsernameField={false}
                      />
                    </Box>
                  </Modal>
                </div>
              )}
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
                    onClick={addUser}
                    className="user-role"
                    type="button"
                    variant="contained"
                    color="primary"
                    style={{ marginLeft: 16, borderRadius: 10 }}
                  >
                    Adicionar
                  </Button>
                </ThemeProvider>
              </div>
            </div>
          </div>
          <div>
            <div>
              <h2 className="left-btn">
                Componentes da banca{" "}
                <small className="missing">
                  {missing !== "" ? missing : null}
                </small>
              </h2>
            </div>
            <h4 className="right-head">
              Limites: 1 orientador, 1 co-orientador, 2 avaliadores
            </h4>
          </div>
          <div className="members-list">
            <div style={{ width: "100%" }}>
              <ThemeProvider theme={theme2}>
                <DataGrid
                  rows={inn}
                  columns={columnsNota}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 20]}
                  rowHeight={62}
                  localeText={ptBRGrid}
                  className={classes.root}
                  autoHeight={true}
                  disableColumnMenu={true}
                  disableColumnFilter={true}
                />
              </ThemeProvider>
            </div>
          </div>
          <ThemeProvider theme={theme}>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={goToDashboard}
              style={{ marginTop: 10, borderRadius: 10 }}
            >
              Finalizar
            </Button>
          </ThemeProvider>
        </div>
      )}
    </Container>
  );
}

export default Addition;
