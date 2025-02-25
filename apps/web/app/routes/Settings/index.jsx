import { Box, Container, Tab, Tabs } from "@material-ui/core";
import React, { useState } from "react";

import "./styles.css";
import PermissionsTab from "./PermissionsTab";
import CoursesTab from "./CoursesTab";

function useTabViewer(defaultPage = 0) {
  const [page, setPage] = useState(defaultPage);
  const handlePageChange = (_, page) => setPage(page);

  return { page, handlePageChange };
}

function TabPanel({ page, currentPage, children, ...props }) {
  return (
    <div role="tabpanel" hidden={page !== currentPage} {...props}>
      {page === currentPage && <Box marginTop={2}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const { page, handlePageChange } = useTabViewer();

  return (
    <Container maxWidth="xl">
      <div className="settings-page-wrapper">
        <Tabs value={page} onChange={handlePageChange}>
          <Tab label="Gerenciar Permissões" />
          <Tab label="Gerenciar Cursos" />
        </Tabs>
        <TabPanel page={0} currentPage={page}>
          <PermissionsTab />
        </TabPanel>
        <TabPanel page={1} currentPage={page}>
          <CoursesTab />
        </TabPanel>
      </div>
    </Container>
  );
}
