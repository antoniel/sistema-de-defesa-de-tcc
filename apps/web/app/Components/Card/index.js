import * as React from "react";
import "./styles.css";

/*
  Componente responsável pela renderização da tabela de defesas
*/

export default function CardBanca(params) {
  return (
    <div className="card">
      <h4 className="card-title">{params.title}</h4>
      {Array.isArray(params.text) ? (
        params.text.map((textSpan) => (
          <span className="card-text">
            {textSpan.nome} - {textSpan.role}
          </span>
        ))
      ) : (
        <span className="card-text">{params.text}</span>
      )}
    </div>
  );
}
