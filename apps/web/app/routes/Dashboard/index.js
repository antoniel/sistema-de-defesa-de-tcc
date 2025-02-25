import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import "./styles.css";
import ReactLoading from "react-loading";
import { Button, Container } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { DataGrid, GridEditInputCell, ptBR } from "@mui/x-data-grid";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { Form, Field } from "react-final-form";
import { TextField } from "final-form-material-ui";
import { Paper, Grid } from "@material-ui/core";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import api from "Config/http";
import { isTeacher } from "Helpers/role";
import { useBancas } from "Hooks/Banca/useBancas";
import DataTable from "Components/Molecular/Table";
import botonLock from "./components/lock-alt-regular-24.png";
import botomunloked from "./components/lock-open-alt-regular-24.png";
import { ptBRGrid } from "Assets/Locales/grid.locale";
import { toast } from "react-toastify";
/*
  Componente responsável pela página de gerenciamento das minhas defesas
*/

function Dashboard() {
  const [dataMinhasDefesas, setDataMinhasDefesas] = useState([]);
  const [dataDefesasParticipo, setDataDefesasParticipo] = useState([]);
  const [done, setDone] = useState(undefined);
  const [open, setOpen] = useState(false);
  const [openNota, setOpenNota] = useState(false);
  const [openNotaOwner, setOpenNotaOwner] = useState(false);
  const [inn, setInn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  const { bancas, loading: loadingBancas } = useBancas();

  const [notas, setNotas] = useState([]);

  const history = useHistory();
  localStorage.removeItem("bancaId");

  const addBanca = () => {
    let path = `addbanca`;
    history.push(path);
  };

  const editBanca = (banca) => {
    let path = `editarbanca/${banca.id}`;
    history.push(path);
  };

  const addUser = (id) => {
    localStorage.setItem("bancaId", id);
    let path = `addition`;
    history.push(path);
  };

  const openModal = (banca) => {
    localStorage.setItem("banca", JSON.stringify(banca));
    setOpen(true);
  };

  const openModalNota = (banca, titulo) => {
    localStorage.setItem("banca", JSON.stringify(banca));
    localStorage.setItem("titulo", titulo);
    setOpenNota(true);
  };

  const openModalNotaOwner = (banca, titulo) => {
    localStorage.setItem("banca", JSON.stringify(banca));
    localStorage.setItem("titulo", titulo);
    getBancaUsuarios(banca);
    setOpenNotaOwner(true);
  };

  const closeModal = () => {
    localStorage.removeItem("banca");
    setOpen(false);
  };

  const closeModalNota = () => {
    localStorage.removeItem("banca");
    localStorage.removeItem("titulo");
    setOpenNota(false);
  };

  const closeModalNotaOwner = () => {
    localStorage.removeItem("banca");
    localStorage.removeItem("titulo");
    setOpenNotaOwner(false);
  };

  const onSubmitSaveGradeBatch = () => {
    onSubmitNotas(notas);
  };

  const userId = localStorage.getItem("userId");

  const themeButton = createTheme({
    palette: {
      primary: {
        main: "#329F5B",
      },
    },
  });

  const useStyles = makeStyles((theme) => ({
    modal: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: "5%",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
    elevation1: {
      boxShadow: "0px 0px 0px",
    },
  }));

  const styles = makeStyles({
    root: {
      borderRadius: "10px",
      "& .MuiDataGrid-columnsContainer": {
        background: "#6c7ae0",
        borderRadius: "10px 10px 0 0px",
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        color: "white",
      },
    },
  });

  const classes = useStyles();

  const getBancaUsuarios = async (bancaId) => {
    setLoading(true);
    api.get(`/usuario-banca/usuarios/${bancaId}`).then(function (response) {
      const notas = response.data.data;
      setLoading(false);
      setNotas(
        notas.map(({ id, nota }) => ({ avaliador: id, nota: Number(nota) }))
      );
      setInn(notas);
      return response;
    });
  };

  const refreshDefesasParticipo = useCallback(() => {
    api.get(`/usuario/${userId}/banca`).then((response) => {
      var events = response.data.data;
      if (events) {
        events.forEach((e) => {
          e.data = new Date(e.data_realizacao);
          e.data.setSeconds(0);
          e.formatedData = `${e.data.toLocaleDateString()} às ${e.data.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )}h`;
        });
      }
      setDataDefesasParticipo(events);
    });
  }, [userId]);

  useEffect(() => {
    refreshDefesasParticipo();

    api.get(`/banca/${userId}/bancas`).then(function (response) {
      var events = response.data.data;
      if (events) {
        events.forEach((e) => {
          e.data = new Date(e.data_realizacao);
          e.data.setSeconds(0);
          e.formatedData = `${e.data.toLocaleDateString()} às ${e.data.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )}h`;
        });
      }
      setDataMinhasDefesas(events);
      setDone(true);
    });
  }, [userId, refreshDefesasParticipo]);

  function getFormData(object) {
    const formData = new FormData();
    Object.keys(object).forEach((key) => formData.append(key, object[key]));
    return formData;
  }

  const validate = (values) => {
    const errors = {};
    if (!values.assunto) {
      errors.assunto = "Obrigatório";
    }
    if (!values.mensagem) {
      errors.mensagem = "Obrigatório";
    }
    if (!values.emails) {
      errors.emails = "Obrigatório";
    }
    return errors;
  };

  const validateNota = (values) => {
    const errors = {};
    if (!values.nota) {
      errors.nota = "Obrigatório";
    } else if (Number(values.nota) > 10 || Number(values.nota) < 0) {
      errors.nota = "Insira um valor válido";
    }
    return errors;
  };

  const onSubmitEmail = async (values) => {
    setLoading(true);
    api
      .post("/usuario-banca/usuarios/email", {
        ...values,
        banca: JSON.parse(localStorage.getItem("banca")),
      })
      .then(function (response) {
        setLoading(false);
        toast.success(response.data.data);
        closeModal();
      })
      .catch(function (error) {
        setLoading(false);
        toast.error("Ocorreu um erro ao tentar enviar o email");
        closeModal();
      });
  };

  const onSubmitNota = async (values) => {
    setLoadingModal(true);
    const banca = JSON.parse(localStorage.getItem("banca"));
    const id = values.avaliador;

    api
      .post(`/usuario-banca/nota/${banca}/${id}`, getFormData(values))
      .then(function (response) {
        setLoadingModal(false);
        toast.success("Nota enviada com sucesso");
        closeModalNotaOwner();
        if (!values.modalOwner) closeModalNota();
        else closeModalNotaOwner();
      })
      .catch(function (error) {
        setLoadingModal(false);
        toast.error("Ocorreu um erro ao tentar dar a nota");
        if (!values.modalOwner) closeModalNota();
        else closeModalNotaOwner();
      });
  };

  const onSubmitNotas = async (notas) => {
    setLoadingModal(true);
    const banca = JSON.parse(localStorage.getItem("banca"));

    api
      .post(`/usuario-banca/notas/${banca}`, { notas })
      .then(function () {
        toast.success("Notas enviadas com sucesso!");
        setLoadingModal(false);
        closeModalNotaOwner();
      })
      .catch(function () {
        toast.error("Não foi possível salvar as notas atribuídas.");
        setLoadingModal(false);
        closeModalNotaOwner();
      });
  };

  const theme = createTheme(
    {
      palette: {
        primary: { main: "#1976d2" },
      },
    },
    ptBR
  );

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box p={3}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  }

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const excluirBanca = (bancaId) => {
    api
      .delete(`/banca/${bancaId}/delete`)
      .then(function (response) {
        toast.success("Banca removida com sucesso");
        window.location.reload();
      })
      .catch(function (error) {
        toast.error(error.response.data.message);
      });
  };

  const RenderLocal = ({ value, row }) => {
    const isRemote = useMemo(() => row.tipo_banca === "remoto", [row]);
    return (
      <>
        {isRemote ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="local-cell"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </>
    );
  };
  const handleVisibilityToggle = async (row) => {
    try {
      const isWorkVisible = Boolean(row.visible !== "0");

      const response = await api.put(`/banca/visibilidade/${row.id}`, {
        visible: !isWorkVisible,
      });

      if (response.status === 200 || response.status === 204) {
        toast.success(
          `A visibilidade foi alterada para ${
            !isWorkVisible ? "Pública" : "Privada"
          }`
        );
        refreshDefesasParticipo();
      } else {
        throw new Error("Erro inesperado ao alterar a visibilidade.");
      }
    } catch (error) {
      console.error("Erro ao alterar a visibilidade: ", error);
      toast.error("Erro ao alterar a visibilidade.");
    }
  };

  const renderDetailsTeacher = (params) => {
    return (
      <div class="grid-actions">
        <button
          title={`${
            params.row.visible !== "0" ? "Bloquear" : "Permitir"
          } visualização da banca`}
          name="edit-publicprivate"
          type="button"
          onClick={() => handleVisibilityToggle(params.row)}
          hidden={!isTeacher()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img
            src={params.row.visible !== "0" ? botomunloked : botonLock}
            alt={`${
              params.row.visible !== "0" ? "Bloquear" : "Permitir"
            } visualização da banca`}
            style={{ width: 24, height: 24 }}
          />
        </button>

        <button
          title="Editar banca"
          name="edit-board"
          type="submit"
          id="edit-board"
          onClick={() => editBanca(params.row)}
        />
        <button
          title="Adicionar membro"
          name="add-user"
          type="submit"
          id="add-user"
          onClick={() => addUser(params.row.id)}
          hidden={!isTeacher()}
        />
        <button
          title="Convidar pessoas para a defesa"
          name="send-email"
          type="submit"
          id="send-email"
          onClick={() => openModal(params.row.id)}
          hidden={!isTeacher()}
        />
        <button
          title="Avaliar"
          name="give-score"
          type="submit"
          id="give-score"
          onClick={() =>
            openModalNotaOwner(params.row.id, params.row.titulo_trabalho)
          }
          hidden={!isTeacher()}
        />
        <button
          title="Excluir Banca"
          name="trash"
          id="trash"
          onClick={() => {
            const answer = window.confirm(
              `Você tem certeza que deseja excluir a banca do projeto '${params.row.titulo_trabalho}'?`
            );
            if (answer) excluirBanca(params.row.id);
          }}
        />
      </div>
    );
  };

  function goToViewBanca(banca) {
    let path = `verbanca?id=` + banca;
    history.push(path);
  }

  const renderDetailsReviewer = (params) => {
    return (
      <button
        title="Dar Nota"
        name="give-score"
        type="submit"
        id="give-score"
        onClick={() => {
          openModalNota(params.row.id, params.row.titulo_trabalho);
        }}
      />
    );
  };

  const renderDetailsBanca = (params) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <button
          title="Ver banca"
          name="see-board"
          type="submit"
          id="see-board"
          onClick={() => goToViewBanca(params.row.id)}
        />
      </div>
    );
  };

  const columns3 = [
    {
      field: "formatedData",
      headerName: "Data",
      minWidth: 160,
      cellClassName: "lowercase",
    },
    {
      field: "titulo_trabalho",
      headerName: "Título do Trabalho",
      minWidth: 650,
    },
    { field: "autor", headerName: "Discente", flex: 1, minWidth: 150 },
    {
      field: "nome_orientador",
      headerName: "Orientador",
      flex: 1,
      minWidth: 150,
    },
    { field: "sigla_curso", headerName: "Curso", minWidth: 50 },
    {
      field: "local",
      headerName: "Local ou link",
      minWidth: 300,
      align: "center",
      renderCell: RenderLocal,
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 100,
      renderCell: renderDetailsBanca,
      disableClickEventBubbling: true,
    },
  ];

  const columns = [
    {
      field: "actions",
      headerName: "Ações",
      width: 200,
      renderCell: renderDetailsTeacher,
      disableClickEventBubbling: true,
      align: "center",
      sortable: false,
    },
    {
      field: "formatedData",
      headerName: "Data",
      minWidth: 160,
      align: "center",
      cellClassName: "lowercase",
    },
    {
      field: "titulo_trabalho",
      headerName: "Título do Trabalho",
      minWidth: 500,
      flex: 1,
      align: "center",
    },
    { field: "autor", headerName: "Discente", minWidth: 200, align: "center" },
    {
      field: "nome_orientador",
      headerName: "Orientador",
      minWidth: 200,
      align: "center",
    },
    {
      field: "sigla_curso",
      headerName: "Curso",
      minWidth: 200,
      align: "center",
    },
    {
      field: "local",
      headerName: "Local ou link",
      minWidth: 300,
      align: "center",
      renderCell: RenderLocal,
    },
  ];

  const columns2 = [
    {
      field: "actions",
      headerName: "Ações",
      width: 200,
      renderCell: (params) => {
        const { row } = params;
        return row.funcao === "orientador"
          ? renderDetailsTeacher(params)
          : renderDetailsReviewer(params);
      },
      disableClickEventBubbling: true,
      align: "center",
    },
    {
      field: "formatedData",
      headerName: "Data",
      width: 160,
      cellClassName: "lowercase",
    },
    {
      field: "titulo_trabalho",
      headerName: "Título do Trabalho",
      minWidth: 500,
      align: "center",
    },
    { field: "autor", headerName: "Discente", width: 200, align: "center" },
    {
      field: "nome_orientador",
      headerName: "Orientador",
      width: 200,
      align: "center",
    },
    { field: "sigla_curso", headerName: "Curso", width: 100, align: "center" },
    {
      field: "local",
      headerName: "Local ou link",
      width: 200,
      align: "center",
      renderCell: RenderLocal,
    },
  ];

  const RenderGradesCell = ({ row }) => {
    const { nota } = row;
    return (
      <>
        {nota ?? "0"}
        <span
          style={{ marginLeft: "0.5rem", width: 12, height: 12 }}
          id="edit-board"
        />
      </>
    );
  };

  const RenderGradesEditCell = (params) => {
    return (
      <GridEditInputCell
        {...params}
        inputProps={{
          max: 10,
          min: 0,
        }}
      />
    );
  };

  const columnsNota = [
    { field: "nome", headerName: "Avaliador", width: 400, align: "center" },
    { field: "role", headerName: "Função", width: 150, align: "center" },
    {
      field: "nota",
      headerName: "Nota",
      minWidth: 300,
      flex: 1,
      disableClickEventBubbling: true,
      align: "center",
      editable: true,
      type: "number",
      renderCell: RenderGradesCell,
      renderEditCell: RenderGradesEditCell,
      valueParser: (value) => {
        return Math.min(10, Math.max(0, value));
      },
    },
  ];

  const onGradeCellEditCommit = ({ id, value }) => {
    setNotas((grades) => [
      ...grades.filter((grade) => grade.avaliador !== id),
      {
        avaliador: id,
        nota: Number(Math.min(10, Math.max(0, value))).toFixed(2),
      },
    ]);
  };

  const classesGrid = styles();

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
        <Container maxWidth="xl">
          <Box height={20} />
          <div className="tcc-list">
            <AppBar
              position="static"
              style={{
                background: "#fff",
                color: "#000",
                display: "-webkit-box",
              }}
            >
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="simple tabs example"
                style={{ width: "100%" }}
              >
                <Tab label="Defesas" {...a11yProps(0)} />
                <Tab label="Minhas defesas" {...a11yProps(1)} />
                <Tab label="Defesas em que participo" {...a11yProps(2)} />
                <ThemeProvider theme={themeButton}>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={addBanca}
                    style={{ borderRadius: 10, marginLeft: "auto" }}
                  >
                    Cadastrar Defesa de TCC
                  </Button>
                </ThemeProvider>
              </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
              <DataTable
                rows={bancas}
                columns={columns3}
                loading={loadingBancas}
              />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div
                style={{
                  height: dataMinhasDefesas.length > 0 ? 400 : 200,
                  width: "100%",
                }}
              >
                <ThemeProvider theme={theme}>
                  <DataGrid
                    rows={dataMinhasDefesas}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[5, 10, 20]}
                    className={classesGrid.root}
                    localeText={{
                      ...ptBRGrid,
                      noRowsLabel: "Não há bancas registradas",
                    }}
                    initialState={{
                      columns: {
                        columnVisibilityModel: {
                          actions: false,
                        },
                      },
                    }}
                    classes={{
                      columnHeader: "dashboard-column",
                    }}
                    autoHeight={true}
                    disableColumnMenu={true}
                    disableColumnFilter={true}
                  />
                </ThemeProvider>
              </div>
            </TabPanel>
            <TabPanel value={value} index={2}>
              <div
                style={{
                  height: dataDefesasParticipo.length > 0 ? 400 : 200,
                  width: "100%",
                }}
              >
                <ThemeProvider theme={theme}>
                  <DataGrid
                    rows={dataDefesasParticipo}
                    columns={columns2}
                    pageSize={10}
                    rowsPerPageOptions={[5]}
                    className={classesGrid.root}
                    localeText={{
                      ...ptBRGrid,
                      noRowsLabel: "Não há bancas registradas",
                    }}
                    classes={{
                      columnHeader: "dashboard-column",
                    }}
                    autoHeight={true}
                    disableColumnMenu={true}
                    disableColumnFilter={true}
                  />
                </ThemeProvider>
              </div>
            </TabPanel>
            <Modal
              aria-labelledby="transition-modal-title"
              aria-describedby="transition-modal-description"
              className={classes.modal}
              open={open}
              onClose={closeModal}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={open}>
                <div className={classes.paper}>
                  {loading ? (
                    <div className="center">
                      <ReactLoading
                        type={"spin"}
                        color={"#41616c"}
                        height={100}
                        width={100}
                      />
                    </div>
                  ) : null}
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h2 id="transition-modal-title">
                      Convidar pessoas para defesa
                    </h2>
                    <span style={{ cursor: "pointer" }} onClick={closeModal}>
                      x
                    </span>
                  </div>
                  <Form
                    onSubmit={onSubmitEmail}
                    initialValues={{
                      mensagem:
                        "Olá, gostaria de convidá-lo(a) para a defesa de TCC abaixo.",
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
                        <Paper
                          className={classes.elevation1}
                          style={{ padding: 16 }}
                        >
                          <Grid container alignItems="flex-start" spacing={2}>
                            <Grid item xs={12}>
                              <Field
                                fullWidth
                                Obrigatório
                                multiline
                                name="emails"
                                component={TextField}
                                type="text"
                                label="E-mail dos convidados para banca (separe os e-mails por vírgula)"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Field
                                fullWidth
                                Obrigatório
                                multiline
                                name="assunto"
                                component={TextField}
                                type="text"
                                label="Assunto"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Field
                                fullWidth
                                Obrigatório
                                multiline
                                name="mensagem"
                                component={TextField}
                                type="text"
                                label="Mensagem"
                              />
                            </Grid>
                            <Grid item style={{ marginTop: 16 }}>
                              <ThemeProvider theme={themeButton}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  type="submit"
                                  disabled={submitting}
                                  style={{ borderRadius: 10 }}
                                >
                                  Enviar
                                </Button>
                              </ThemeProvider>
                            </Grid>
                          </Grid>
                        </Paper>
                      </form>
                    )}
                  />
                </div>
              </Fade>
            </Modal>
            <Modal
              aria-labelledby="transition-modal-title"
              aria-describedby="transition-modal-description"
              className={classes.modal}
              open={openNota}
              onClose={closeModalNota}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={openNota}>
                <div className={classes.paper}>
                  {loading ? (
                    <div className="center">
                      <ReactLoading
                        type={"spin"}
                        color={"#41616c"}
                        height={100}
                        width={100}
                      />
                    </div>
                  ) : null}
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h3 id="transition-modal-title">
                      Avaliar a banca: {localStorage.getItem("titulo")}
                    </h3>
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={closeModalNota}
                    >
                      x
                    </span>
                  </div>
                  <Form
                    onSubmit={onSubmitNota}
                    initialValues={{
                      avaliador: JSON.parse(localStorage.getItem("userId")),
                    }}
                    validate={validateNota}
                    render={({ handleSubmit, submitting }) => (
                      <form onSubmit={handleSubmit} noValidate>
                        <Paper
                          className={classes.elevation1}
                          style={{ padding: 16 }}
                        >
                          <Grid container alignItems="flex-start" spacing={2}>
                            <Grid item xs={12}>
                              <Field
                                fullWidth
                                Obrigatório
                                type="number"
                                name="nota"
                                component={TextField}
                                InputProps={{
                                  inputProps: {
                                    min: 0,
                                    max: 10,
                                    type: "number",
                                  },
                                }}
                                label="Nota"
                              />
                            </Grid>
                            <Grid item style={{ marginTop: 16 }}>
                              <ThemeProvider theme={themeButton}>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  type="submit"
                                  disabled={submitting}
                                  style={{ borderRadius: 10 }}
                                >
                                  Enviar
                                </Button>
                              </ThemeProvider>
                            </Grid>
                          </Grid>
                        </Paper>
                      </form>
                    )}
                  />
                </div>
              </Fade>
            </Modal>
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
              <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                className={classes.modal}
                open={openNotaOwner}
                onClose={closeModalNotaOwner}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                  timeout: 500,
                }}
                style={{ width: "100%" }}
              >
                <Fade in={openNotaOwner}>
                  <div className={classes.paper}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3 id="transition-modal-title">
                        Avaliar a banca: {localStorage.getItem("titulo")}
                      </h3>
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={closeModalNotaOwner}
                      >
                        x
                      </span>
                    </div>
                    <Paper
                      className={classes.elevation1}
                      style={{ padding: 16, width: "1050px" }}
                    >
                      <Grid container alignItems="flex-start" spacing={2}>
                        <Grid item xs={12}>
                          {loadingModal ? (
                            <div className="center">
                              <ReactLoading
                                type={"spin"}
                                color={"#41616c"}
                                height={100}
                                width={100}
                              />
                            </div>
                          ) : null}
                          <div
                            style={{
                              height: inn.length > 0 ? 400 : 200,
                              width: "100%",
                            }}
                          >
                            <DataGrid
                              rows={inn}
                              columns={columnsNota}
                              onCellEditCommit={onGradeCellEditCommit}
                              pageSize={10}
                              rowsPerPageOptions={[5, 10, 20]}
                              rowHeight={62}
                              className={classesGrid.root}
                              localeText={{
                                ...ptBRGrid,
                                noRowsLabel:
                                  "Não há membros registrados na banca",
                              }}
                              classes={{
                                columnHeader: "dashboard-column",
                              }}
                              autoHeight={true}
                              disableColumnMenu={true}
                              disableColumnFilter={true}
                            />
                            <Box
                              marginTop={2}
                              display="flex"
                              justifyContent="flex-end"
                            >
                              <ThemeProvider theme={themeButton}>
                                <Button
                                  variant="contained"
                                  type="button"
                                  color="primary"
                                  onClick={onSubmitSaveGradeBatch}
                                  style={{
                                    borderRadius: 10,
                                    marginLeft: "auto",
                                  }}
                                >
                                  Salvar Notas
                                </Button>
                              </ThemeProvider>
                            </Box>
                          </div>
                        </Grid>
                      </Grid>
                    </Paper>
                  </div>
                </Fade>
              </Modal>
            )}
          </div>
        </Container>
      )}
    </>
  );
}

export default Dashboard;
