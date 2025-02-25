import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import ReactLoading from "react-loading";
import { useHistory } from "react-router-dom";
import DataTable from "../../Components/Molecular/Table";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import TextField from "@material-ui/core/TextField";
import api from "Config/http";
import {
  Button,
  Container,
  ThemeProvider,
  createTheme,
} from "@material-ui/core";
import { isTeacher } from "Helpers/role";

/*
  Componente responsável pela homepage
*/

const themeButton = createTheme({
  palette: {
    primary: {
      main: "#329F5B",
    },
  },
});

const Home = () => {
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [done, setDone] = useState(undefined);

  const history = useHistory();

  function goToViewBanca(banca) {
    let path = `verbanca?id=` + banca;
    history.push(path);
  }

  const renderDetailsButton = (params) => {
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

  const columns = [
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
      renderCell: RenderLocal,
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 100,
      renderCell: renderDetailsButton,
      disableClickEventBubbling: true,
    },
  ];

  const searchBoard = () => {
    const SEARCH_PROPERTIES = [
      "ano",
      "autor",
      "formatedData",
      "local",
      "nome_orientador",
      "palavras_chave",
      "resumo",
      "sigla_curso",
      "titulo_trabalho",
      "membros",
    ];

    const matchSearchQuery = (element, query) =>
      Boolean(
        SEARCH_PROPERTIES.find((property) => {
          if (Array.isArray(element[property]))
            return Boolean(
              element[property].find((item) =>
                item.toLocaleLowerCase().includes(query.toLocaleLowerCase())
              )
            );

          return String(element[property])
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase());
        })
      );

    let inputValue = document.getElementById("banca-search").value;
    let data1 = rawData[0].filter((element) =>
      matchSearchQuery(element, inputValue)
    );
    let data2 = rawData[1].filter((element) =>
      matchSearchQuery(element, inputValue)
    );
    var allEvents = [];
    allEvents.push(data1);
    allEvents.push(data2);
    setData(allEvents);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    searchBoard();
  };

  useEffect(() => {
    api.get("/banca").then(function (response) {
      var events = response.data.data;
      if (events) {
        events.forEach((e) => {
          e.data = new Date(e.data_realizacao);
          e.data.setSeconds(0);
          e.formatedData = `${e.data.toLocaleDateString()} às ${e.data.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )}h`;
          // e.autor = "Frederico Durão";
        });
        const dt = new Date();
        events.sort((a, b) => (a.data_realizacao < b.data_realizacao ? -1 : 1));
        var olderEvents = events.filter((a) => a.data < dt);
        events = events.filter((a) => a.data > dt);
        var allEvents = [];
        allEvents.push(events);
        allEvents.push(olderEvents);
        setRawData(allEvents);
      }
      setDone(true);
      return response;
    });
  }, []);

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

  return (
    <Container maxWidth="xl">
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
          <form
            className="search-form"
            noValidate
            autoComplete="off"
            onSubmit={onSubmit}
          >
            <div>
              <TextField
                id="banca-search"
                label="Buscar defesas, alunos, orientadores ou avaliadores"
                variant="outlined"
                style={{ backgroundColor: "white" }}
              />
              <button
                title="Pesquisar bancas"
                name="search-board"
                type="button"
                id="search-board"
                onClick={() => searchBoard()}
              ></button>
            </div>
          </form>
          <AppBar
            position="static"
            style={{ background: "#fff", color: "#000" }}
          >
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="simple tabs example"
            >
              <Tab label="Próximas defesas" {...a11yProps(0)} />
              <Tab label="Defesas anteriores" {...a11yProps(1)} />
              {isTeacher() && (
                <ThemeProvider theme={themeButton}>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={() => history.push("addbanca")}
                    style={{ borderRadius: 10, marginLeft: "auto" }}
                  >
                    Cadastrar Defesa de TCC
                  </Button>
                </ThemeProvider>
              )}
            </Tabs>
          </AppBar>
          <TabPanel value={value} index={0}>
            <DataTable
              onCellDoubleClick={goToViewBanca}
              columns={columns}
              rows={data.length > 0 ? data[0] : rawData[0]}
            />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <DataTable
              rows={data.length > 0 ? data[1] : rawData[1]}
              columns={columns}
            />
          </TabPanel>
        </div>
      )}
    </Container>
  );
};

export default Home;
