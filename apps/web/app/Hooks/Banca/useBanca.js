import api from "Config/http";
import { useEffect, useState } from "react";

export function useBanca(id) {
  const [loading, setLoading] = useState(false);
  const [banca, setBanca] = useState();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/banca/${id}`)
      .then(({ data: { data: response } }) => {
        setBanca(response);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { banca, loading };
}
