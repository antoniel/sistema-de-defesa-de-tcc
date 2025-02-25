import api from "Config/http";
import { useEffect, useState } from "react";

export function useBancas() {
  const [loading, setLoading] = useState(false);
  const [bancas, setBancas] = useState([]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/banca`)
      .then(({ data: { data: response } }) => {
        setBancas(
          response.map((banca) => {
            const date = new Date(banca.data_realizacao);
            date.setSeconds(0);

            return {
              ...banca,
              data: date,
              formatedData: `${date.toLocaleDateString()} às ${date.toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              )}h`,
            };
          })
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { bancas, loading };
}
