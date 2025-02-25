import * as React from "react";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { DataGrid, ptBR } from "@mui/x-data-grid";
import { makeStyles } from "@material-ui/core/styles";
import { ptBRGrid } from "Assets/Locales/grid.locale";

/*
  Componente responsável pela renderização da tabela de defesas
*/
const theme = createTheme(
  {
    palette: {
      primary: { main: "#1976d2" },
    },
  },
  ptBR
);

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

export default function DataTable(params) {
  const classes = styles();
  return (
    <div style={{ height: params.rows.length > 0 ? 400 : 200, width: "100%" }}>
      <ThemeProvider theme={theme}>
        <DataGrid
          onCellDoubleClick={(pms, event) => {
            event.defaultMuiPrevented = true;
            params.onCellDoubleClick(pms.id);
          }}
          rows={params.rows}
          columns={params.columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          className={classes.root}
          localeText={{ ...ptBRGrid, noRowsLabel: "Não há bancas registradas" }}
          loading={params.loading}
          autoHeight={true}
          disableColumnMenu={true}
          disableColumnFilter={true}
          classes={{
            columnHeader: "dashboard-column",
          }}
        />
      </ThemeProvider>
    </div>
  );
}
