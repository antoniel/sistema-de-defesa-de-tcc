import api from "Config/http";
import { useEffect, useMemo, useState } from "react";

export default function useUsers(rank) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const refreshUsers = () => {
    return api
      .get("/usuario")
      .then(({ data: { data: users } }) => setUsers(users));
  };

  useEffect(() => {
    setLoading(true);
    refreshUsers().finally(() => setLoading(false));
  }, [rank]);

  const memoizedUsers = useMemo(() => {
    if (query) {
      return users.filter(
        (user) =>
          user.nome && user.nome.toLowerCase().includes(query.toLowerCase())
      );
    }
    return users;
  }, [users, query]);

  const handleEditRole = (id, role) => {
    setLoading(true);
    api
      .post(`/usuario/${id}/role`, { role })
      .then(refreshUsers)
      .finally(() => setLoading(false));
  };

  const handleSearch = (query) => setQuery(query);

  return { loading, users: memoizedUsers, handleSearch, handleEditRole };
}
