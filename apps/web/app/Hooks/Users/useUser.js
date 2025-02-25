import { useEffect, useState } from "react";
import api from "Config/http";

export default function useUser(id) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState();

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get(`/usuario/${id}`)
        .then(({ data: { data: user } }) => {
          setUser(user);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const updateUser = async (user) => {
    setLoading(true);
    return api
      .put(`/usuario/${id}`, user)
      .then(({ data: { data: user } }) => {
        localStorage.setItem("nome", user.nome);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return { user, loading, updateUser };
}
