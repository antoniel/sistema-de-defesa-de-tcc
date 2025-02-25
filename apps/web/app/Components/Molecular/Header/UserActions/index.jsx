import React, { useState } from "react";

import { Avatar, Box, Menu, MenuItem, Tooltip } from "@material-ui/core";

import { ROLES_DICT } from "Pages/Settings/PermissionsTab";
import "./styles.css";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import { Create, ExitToApp } from "@material-ui/icons";

function getInitials(name) {
  if (!name) return "";

  const [first, second] = name.split(" ");
  return `${first[0]}${second?.lenght ? second[0] : ""}`;
}

function getRoleName(role) {
  return ROLES_DICT[role];
}

export default function UserActions({ name, role, isLoggedIn, onClickLogout }) {
  const [anchorEl, setAnchor] = useState(null);
  const initials = getInitials(name);
  const open = Boolean(anchorEl);

  const history = useHistory();

  const handleClose = () => {
    setAnchor(null);
  };

  const handleClick = (e) => {
    setAnchor(e.currentTarget);
  };

  const handleClickMyAccount = () => {
    history.push("account");
  };

  return isLoggedIn ? (
    <div className="user-actions-wrapper">
      <Tooltip title="Opções da Conta" placement="bottom" arrow>
        <Box
          sx={{ boxShadow: 1 }}
          display="flex"
          justifyContent="center"
          onClick={handleClick}
        >
          <Avatar autoCapitalize style={{ backgroundColor: "#6c7ae0" }}>
            {initials}
          </Avatar>
          <div className="user-actions">
            <p className="name">{name}</p>
            <p className="role">{getRoleName(role)}</p>
          </div>
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          style: {
            left: "50%",
            transform: "translateY(55%)",
          },
        }}
        arrow
      >
        <MenuItem onClick={handleClickMyAccount}>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginRight={1}
            >
              <Create className="icon" />
            </Box>
            Editar informações
          </Box>
        </MenuItem>
        <MenuItem onClick={onClickLogout}>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginRight={1}
            >
              <ExitToApp className="icon" />
            </Box>
            Sair
          </Box>
        </MenuItem>
      </Menu>
    </div>
  ) : (
    <>Enrtar??</>
  );
}
