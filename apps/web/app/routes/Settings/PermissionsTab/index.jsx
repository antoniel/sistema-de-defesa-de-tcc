import { Box, ThemeProvider, createTheme, Button } from "@material-ui/core";
import React from "react";

import { makeStyles } from "@material-ui/styles";
import { DataGrid } from "@mui/x-data-grid";
import ReactLoading from "react-loading";

import useUsers from "Hooks/Users/useUsers";
import { TextField } from "@material-ui/core";
import useAdminActions from "Hooks/Admin/useAdminActions";
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

export const ROLES_DICT = {
  0: "Discente",
  1: "Orientador",
  2: "Avaliador",
  3: "Administrador",
};

function RenderRolesCell({ row }) {
  const { role } = row;
  return (
    <>
      {ROLES_DICT[role] || "Indefinido"}
      <span style={{ marginLeft: "0.5rem" }} id="edit-board" />
    </>
  );
}

export default function PermissionsTab() {
  const { users, loading, handleEditRole, handleSearch } = useUsers();
  const { loading: adminActionsLoading, generateInvitationLink } =
    useAdminActions();
  const classes = useStyles();

  const columns = [
    { field: "nome", headerName: "Nome", minWidth: 150, flex: 1 },
    {
      field: "role",
      headerName: "Nível de Acesso",
      minWidth: 250,
      editable: true,
      type: "singleSelect",
      valueOptions: Object.keys(ROLES_DICT).map((key) => ({
        label: ROLES_DICT[key],
        value: key,
      })),
      headerAlign: "center",
      align: "center",
      renderCell: RenderRolesCell,
    },
  ];

  const themeButton = createTheme({
    palette: {
      primary: {
        main: "#329F5B",
      },
    },
  });

  return (
    <>
      {loading || adminActionsLoading ? (
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
          <Box
            display="flex"
            flexDirection="row"
            marginBottom="1rem"
            height="56px"
          >
            <TextField
              id="banca-search"
              label="Buscar Usuários"
              variant="outlined"
              style={{ backgroundColor: "white" }}
              onChange={(e) => handleSearch(e.target.value || "")}
            />
            <ThemeProvider theme={themeButton}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                onClick={generateInvitationLink}
                style={{ borderRadius: 10, marginLeft: "1rem" }}
              >
                Gerar Link de Convite
              </Button>
            </ThemeProvider>
          </Box>
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            className={classes.root}
            autoHeight={true}
            localeText={ptBRGrid}
            disableColumnMenu={true}
            disableColumnFilter={true}
            onCellEditCommit={({ id, value: role }) => handleEditRole(id, role)}
          />
        </>
      )}
    </>
  );
}
