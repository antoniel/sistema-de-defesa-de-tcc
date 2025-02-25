import React from "react";
import { BrowserRouter } from "react-router-dom";

import Routes from "../../routes";
import Header from "../Molecular/Header";
import Footer from "../Molecular/Footer";
import Context from "../../Context";

/*
  Componente responsável pela renderização do 'invólucro' da aplicação
*/

function App() {
  return (
    <BrowserRouter>
      <Context>
        <Header />
        <div
          className="app-container"
          style={{
            minHeight: "79vh",
            maxHeight: "85vh",
            maxWidth: "99.9vw",
          }}
        >
          <div
            style={{
              minHeight: 500,
            }}
          >
            <Routes />
          </div>
        </div>
      </Context>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
