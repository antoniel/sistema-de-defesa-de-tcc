import React, { useReducer } from "react";

import { makeStyles } from "@material-ui/styles";
import { DataGrid } from "@mui/x-data-grid";
import ReactLoading from "react-loading";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Modal,
  TextField,
  ThemeProvider,
  createTheme,
} from "@material-ui/core";
import useCourses from "Hooks/Users/useCourses";
import CourseForm from "./CourseForm";
import { ptBRGrid } from "Assets/Locales/grid.locale";

const useStyles = makeStyles({
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

const themeButton = createTheme({
  palette: {
    primary: {
      main: "#329F5B",
    },
  },
});

const COURSES_MODAL_ACTIONS = {
  OPEN_MODAL: "OPEN_MODAL",
  CLOSE_MODAL: "CLOSE_MODAL",
  UPDATE_SELECTED_COURSE: "UPDATE_SELECTED_COURSE",
};

const INITIAL_STATE = {
  open: false,
  selectedCourse: undefined,
};

function useCoursesModalReducer(state = INITIAL_STATE, action = null) {
  switch (action.type) {
    case COURSES_MODAL_ACTIONS.OPEN_MODAL:
      return { ...state, open: true };
    case COURSES_MODAL_ACTIONS.CLOSE_MODAL:
      return { ...state, open: false };
    case COURSES_MODAL_ACTIONS.UPDATE_SELECTED_COURSE:
      return { ...state, selectedCourse: action.payload };
    default:
      return state;
  }
}

function useCoursesModal() {
  const [state, dispatch] = useReducer(useCoursesModalReducer, INITIAL_STATE);

  const openModal = () => dispatch({ type: COURSES_MODAL_ACTIONS.OPEN_MODAL });
  const closeModal = () =>
    dispatch({ type: COURSES_MODAL_ACTIONS.CLOSE_MODAL });

  const updateSelectedCourse = (course) =>
    dispatch({
      type: COURSES_MODAL_ACTIONS.UPDATE_SELECTED_COURSE,
      payload: course,
    });

  return { ...state, updateSelectedCourse, openModal, closeModal };
}

export default function CoursesTab() {
  const classes = useStyles();
  const {
    courses,
    loading,
    handleSearch,
    handleCreate,
    handleEdit,
    handleDelete,
  } = useCourses();
  const { open, updateSelectedCourse, selectedCourse, openModal, closeModal } =
    useCoursesModal();

  const {
    open: deleteConfirmationOpen,
    updateSelectedCourse: updateSelectedCourseToDelete,
    selectedCourse: selectedCourseToDelete,
    openModal: openDeleteConfirmation,
    closeModal: closeDeleteConfirmation,
  } = useCoursesModal();

  const columns = [
    {
      field: "sigla",
      headerName: "Sigla",
      minWidth: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "nome",
      headerName: "Nome",
      minWidth: 300,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "disciplina",
      headerName: "Disciplina de Conclusão",
      minWidth: 250,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "coordenacao",
      headerName: "Coordenador",
      minWidth: 300,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "cargo_coordenacao",
      headerName: "Título do Coordenador",
      minWidth: 300,
      flex: 1,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "id",
      headerName: "Ações",
      renderCell: CoursesAction,
      sortable: false,
      headerAlign: "center",
      align: "center",
    },
  ];

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

  function CoursesAction({ row }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <button
          title="Editar Curso"
          name="edit-course"
          id="edit-board"
          onClick={() => {
            updateSelectedCourse(row);
            openModal();
          }}
        />
        <button
          title="Excluir curso"
          name="delete-course"
          id="trash"
          onClick={() => {
            updateSelectedCourseToDelete(row);
            openDeleteConfirmation();
          }}
        />
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ReactLoading
            type={"spin"}
            color={"#41616c"}
            height={50}
            width={50}
          />
        </div>
      ) : (
        <>
          <Dialog
            open={deleteConfirmationOpen}
            onClose={closeDeleteConfirmation}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">Excluir Curso</DialogTitle>
            <DialogContent>
              {selectedCourseToDelete && (
                <>
                  <DialogContentText id="alert-dialog-description">
                    Tem certeza que deseja excluir o curso{" "}
                    {selectedCourseToDelete.nome}?
                  </DialogContentText>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDeleteConfirmation}>Cancelar</Button>
              <Button
                onClick={() => {
                  handleDelete(selectedCourseToDelete);
                  closeDeleteConfirmation();
                }}
                autoFocus
              >
                Excluir Curso
              </Button>
            </DialogActions>
          </Dialog>
          <Modal open={open} onClose={closeModal}>
            <Box sx={style}>
              <CourseForm
                course={selectedCourse}
                onSubmit={(values) => {
                  const { id } = values;
                  if (id) handleEdit(values);
                  else handleCreate(values);

                  closeModal();
                }}
              />
            </Box>
          </Modal>
          <Grid container spacing={2} style={{ marginBottom: "1rem" }}>
            <Grid item xs={10}>
              <TextField
                id="banca-search"
                label="Buscar Cursos"
                variant="outlined"
                style={{ backgroundColor: "white" }}
                onChange={(e) => handleSearch(e.target.value || "")}
              />
            </Grid>
            <Grid item xs={2}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ThemeProvider theme={themeButton}>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      updateSelectedCourse({
                        nome: "",
                        sigla: "",
                        disciplina: "",
                        coordenacao: "",
                        cargo_coordenacao: "",
                      });
                      openModal();
                    }}
                    style={{ borderRadius: 10, width: "100%", height: "56px" }}
                  >
                    Cadastrar Curso
                  </Button>
                </ThemeProvider>
              </div>
            </Grid>
            <Grid item xs={12}>
              <DataGrid
                rows={courses}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 20]}
                className={classes.root}
                autoHeight
                localeText={ptBRGrid}
                disableColumnMenu
                disableColumnFilter
                disableSelectionOnClick
              />
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}
